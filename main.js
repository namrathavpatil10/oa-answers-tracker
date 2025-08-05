async function loadAnswers() {
  const response = await fetch('answers.json');
  const answers = await response.json();
  return answers;
}

function getStoredAnswers() {
  const stored = localStorage.getItem('oa_answers');
  return stored ? JSON.parse(stored) : [];
}

function saveAnswers(answers) {
  localStorage.setItem('oa_answers', JSON.stringify(answers));
}

function deleteAnswer(answers, index) {
  if (confirm('Are you sure you want to delete this answer?')) {
    answers.splice(index, 1);
    saveAnswers(answers);
    renderAnswers(answers);
    renderTable(answers);
  }
}

function renderAnswers(answers) {
  const container = document.getElementById('answers-container');
  container.innerHTML = '';
  answers.forEach((item, idx) => {
    const favKey = `fav_${item.company}_${item.date}_${idx}`;
    const isFav = JSON.parse(localStorage.getItem(favKey)) ?? item.favorite;
    const card = document.createElement('div');
    card.className = 'answer-card';
    card.innerHTML = `
      <h3>${item.company} <span class="date">${item.date}</span></h3>
      <p><strong>Q:</strong> ${item.question}</p>
      <p><strong>A:</strong> ${item.answer}</p>
      <div class="card-actions">
        <button class="fav-btn" data-key="${favKey}">${isFav ? '★ Favorite' : '☆ Mark Favorite'}</button>
        <button class="delete-btn" data-index="${idx}">🗑️ Delete</button>
      </div>
    `;
    card.querySelector('.fav-btn').onclick = function() {
      const newFav = !isFav;
      localStorage.setItem(favKey, JSON.stringify(newFav));
      renderAnswers(answers);
      renderTable(answers);
    };
    card.querySelector('.delete-btn').onclick = function() {
      deleteAnswer(answers, idx);
    };
    container.appendChild(card);
  });
}

function renderTable(answers) {
  const container = document.getElementById('table-container');
  container.innerHTML = '';
  
  if (answers.length === 0) {
    container.innerHTML = '<p class="no-data">No answers found.</p>';
    return;
  }
  
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
  answers.forEach((item, idx) => {
    const favKey = `fav_${item.company}_${item.date}_${idx}`;
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
        <button class="delete-btn-table" data-index="${idx}">🗑️</button>
      </td>
    `;
    
    row.querySelector('.fav-btn-table').onclick = function() {
      const newFav = !isFav;
      localStorage.setItem(favKey, JSON.stringify(newFav));
      renderAnswers(answers);
      renderTable(answers);
    };
    
    row.querySelector('.delete-btn-table').onclick = function() {
      deleteAnswer(answers, idx);
    };
    
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  container.appendChild(table);
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
  
  // Re-render both views
  renderAnswers(allAnswers);
  renderTable(allAnswers);
  
  // Show success message
  alert('Answer added successfully!');
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

function switchView(view) {
  const cardContainer = document.getElementById('answers-container');
  const tableContainer = document.getElementById('table-container');
  const cardBtn = document.getElementById('card-view-btn');
  const tableBtn = document.getElementById('table-view-btn');
  
  if (view === 'table') {
    cardContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    cardBtn.classList.remove('active');
    tableBtn.classList.add('active');
  } else {
    cardContainer.style.display = 'block';
    tableContainer.style.display = 'none';
    cardBtn.classList.add('active');
    tableBtn.classList.remove('active');
  }
}

window.onload = async function() {
  // Load initial answers from JSON file
  const initialAnswers = await loadAnswers();
  
  // Get stored answers (if any)
  const storedAnswers = getStoredAnswers();
  
  // Combine and display
  const allAnswers = [...initialAnswers, ...storedAnswers];
  renderAnswers(allAnswers);
  renderTable(allAnswers);
  
  // Set up form handler
  document.getElementById('add-answer-form').addEventListener('submit', handleFormSubmit);
  
  // Set up view toggle handlers
  document.getElementById('card-view-btn').addEventListener('click', () => switchView('card'));
  document.getElementById('table-view-btn').addEventListener('click', () => switchView('table'));
  
  // Add download button
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download Updated JSON';
  downloadBtn.onclick = downloadJSON;
  downloadBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
  document.body.appendChild(downloadBtn);
}; 