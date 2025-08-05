async function loadAnswers() {
  try {
    const response = await fetch('answers.json');
    const answers = await response.json();
    return answers;
  } catch (error) {
    console.error('Error loading answers:', error);
    return [];
  }
}

function getStoredAnswers() {
  const stored = localStorage.getItem('oa_answers');
  return stored ? JSON.parse(stored) : [];
}

function saveAnswers(answers) {
  localStorage.setItem('oa_answers', JSON.stringify(answers));
  // Also update the answers.json file
  updateAnswersFile(answers);
}

async function updateAnswersFile(answers) {
  try {
    // Create a blob with the updated data
    const dataStr = JSON.stringify(answers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    // Create a download link to save the updated file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'answers.json';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show instructions to user
    showUpdateInstructions();
  } catch (error) {
    console.error('Error updating answers file:', error);
  }
}

function showUpdateInstructions() {
  const instructions = document.createElement('div');
  instructions.className = 'update-instructions';
  instructions.innerHTML = `
    <div class="instruction-box">
      <h3>📁 Data Updated!</h3>
      <p>Your answers.json file has been downloaded. To persist your data:</p>
      <ol>
        <li>Replace the answers.json file in your repository</li>
        <li>Commit and push the changes</li>
        <li>GitHub Actions will automatically validate the data</li>
      </ol>
      <button onclick="this.parentElement.parentElement.remove()">Got it!</button>
    </div>
  `;
  document.body.appendChild(instructions);
}

function deleteAnswer(answers, index) {
  if (confirm('Are you sure you want to delete this answer?')) {
    answers.splice(index, 1);
    saveAnswers(answers);
    renderTable(answers);
  }
}

function renderTable(answers, currentPage = 1) {
  const container = document.getElementById('table-container');
  container.innerHTML = '';
  
  if (answers.length === 0) {
    container.innerHTML = '<p class="no-data">No answers found.</p>';
    return;
  }
  
  // Pagination settings
  const itemsPerPage = 10;
  const totalPages = Math.ceil(answers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAnswers = answers.slice(startIndex, endIndex);
  
  const table = document.createElement('table');
  table.className = 'answers-table';
  
  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Company</th>
      <th>Date</th>
      <th>Question</th>
      <th>Answer</th>
      <th>Favorite</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create table body
  const tbody = document.createElement('tbody');
  currentAnswers.forEach((item, idx) => {
    const actualIndex = startIndex + idx;
    const favKey = `fav_${item.company}_${item.date}_${actualIndex}`;
    const isFav = JSON.parse(localStorage.getItem(favKey)) ?? item.favorite;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.company}</td>
      <td>${item.date}</td>
      <td>${item.question}</td>
      <td>${item.answer}</td>
      <td>
        <button class="fav-btn-table" data-key="${favKey}">
          ${isFav ? '★' : '☆'}
        </button>
      </td>
      <td>
        <button class="delete-btn-table" data-index="${actualIndex}">🗑️</button>
      </td>
    `;
    
    row.querySelector('.fav-btn-table').onclick = function() {
      const newFav = !isFav;
      localStorage.setItem(favKey, JSON.stringify(newFav));
      renderTable(answers, currentPage);
    };
    
    row.querySelector('.delete-btn-table').onclick = function() {
      deleteAnswer(answers, actualIndex);
    };
    
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Add pagination controls
  if (totalPages > 1) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    // Previous button
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '← Previous';
      prevBtn.onclick = () => renderTable(answers, currentPage - 1);
      pagination.appendChild(prevBtn);
    }
    
    // Page numbers
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${answers.length} total answers)`;
    pageInfo.className = 'page-info';
    pagination.appendChild(pageInfo);
    
    // Next button
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next →';
      nextBtn.onclick = () => renderTable(answers, currentPage + 1);
      pagination.appendChild(nextBtn);
    }
    
    container.appendChild(pagination);
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  
  const newAnswer = {
    company: document.getElementById('company').value,
    date: document.getElementById('date').value,
    question: document.getElementById('question').value,
    answer: document.getElementById('answer').value,
    favorite: false
  };
  
  // Get existing answers and add new one
  const existingAnswers = getStoredAnswers();
  const allAnswers = [...existingAnswers, newAnswer];
  saveAnswers(allAnswers);
  
  // Clear form
  event.target.reset();
  
  // Re-render table (go to last page to show new answer)
  const totalPages = Math.ceil(allAnswers.length / 10);
  renderTable(allAnswers, totalPages);
  
  // Show success message
  alert('Answer added successfully! Check the downloaded answers.json file.');
}

function downloadJSON() {
  const answers = getStoredAnswers();
  const dataStr = JSON.stringify(answers, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'answers.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function syncFromGitHub() {
  try {
    const answers = await loadAnswers();
    const storedAnswers = getStoredAnswers();
    
    // Merge GitHub data with local data
    const allAnswers = [...answers, ...storedAnswers];
    
    // Remove duplicates based on company + date + question
    const uniqueAnswers = allAnswers.filter((answer, index, self) => 
      index === self.findIndex(a => 
        a.company === answer.company && 
        a.date === answer.date && 
        a.question === answer.question
      )
    );
    
    saveAnswers(uniqueAnswers);
    renderTable(uniqueAnswers, 1);
    
    console.log('✅ Synced data from GitHub');
  } catch (error) {
    console.error('Error syncing from GitHub:', error);
  }
}

window.onload = async function() {
  // Load initial answers from JSON file
  const initialAnswers = await loadAnswers();
  
  // Get stored answers (if any)
  const storedAnswers = getStoredAnswers();
  
  // Combine and display
  const allAnswers = [...initialAnswers, ...storedAnswers];
  renderTable(allAnswers, 1);
  
  // Set up form handler
  document.getElementById('add-answer-form').addEventListener('submit', handleFormSubmit);
  
  // Add download button
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download Updated JSON';
  downloadBtn.onclick = downloadJSON;
  downloadBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
  document.body.appendChild(downloadBtn);
  
  // Add sync button
  const syncBtn = document.createElement('button');
  syncBtn.textContent = '🔄 Sync from GitHub';
  syncBtn.onclick = syncFromGitHub;
  syncBtn.style.cssText = 'position: fixed; top: 60px; right: 20px; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;';
  document.body.appendChild(syncBtn);
}; 