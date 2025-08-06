// Firebase Firestore functions
async function loadAnswers() {
  try {
    const querySnapshot = await window.firebaseGetDocs(window.firebaseCollection(window.firebaseDb, "answers"));
    const answers = [];
    querySnapshot.forEach((doc) => {
      answers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return answers;
  } catch (error) {
    console.error('Error loading answers from Firestore:', error);
    return [];
  }
}

async function addAnswerToFirestore(answer) {
  try {
    const docRef = await window.firebaseAddDoc(window.firebaseCollection(window.firebaseDb, "answers"), {
      company: answer.company,
      date: answer.date,
      question: answer.question,
      answer: answer.answer,
      favorite: answer.favorite,
      createdAt: new Date().toISOString()
    });
    console.log("Answer added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding answer: ", error);
    throw error;
  }
}

async function deleteAnswerFromFirestore(answerId) {
  try {
    await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseDb, "answers", answerId));
    console.log("Answer deleted successfully");
  } catch (error) {
    console.error("Error deleting answer: ", error);
    throw error;
  }
}

async function updateFavoriteInFirestore(answerId, isFavorite) {
  try {
    await window.firebaseUpdateDoc(window.firebaseDoc(window.firebaseDb, "answers", answerId), {
      favorite: isFavorite
    });
    console.log("Favorite updated successfully");
  } catch (error) {
    console.error("Error updating favorite: ", error);
    throw error;
  }
}

// Real-time listener for data changes
function setupRealtimeListener() {
  try {
    const unsubscribe = window.firebaseOnSnapshot(window.firebaseCollection(window.firebaseDb, "answers"), (snapshot) => {
      const answers = [];
      snapshot.forEach((doc) => {
        answers.push({
          id: doc.id,
          ...doc.data()
        });
      });
      renderTable(answers, 1);
    });
    
    // Store unsubscribe function for cleanup
    window.firestoreUnsubscribe = unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time listener:', error);
  }
}

function renderTable(answers, currentPage = 1) {
  const container = document.getElementById('table-container');
  container.innerHTML = '';
  
  if (answers.length === 0) {
    container.innerHTML = '<p class="no-data">No answers found. Add your first answer above!</p>';
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
  currentAnswers.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.company}</td>
      <td>${item.date}</td>
      <td>${item.question}</td>
      <td>${item.answer}</td>
      <td>
        <button class="fav-btn-table" data-id="${item.id}" data-favorite="${item.favorite}">
          ${item.favorite ? '★' : '☆'}
        </button>
      </td>
      <td>
        <button class="delete-btn-table" data-id="${item.id}">🗑️</button>
      </td>
    `;
    
    row.querySelector('.fav-btn-table').onclick = async function() {
      const answerId = this.getAttribute('data-id');
      const currentFavorite = this.getAttribute('data-favorite') === 'true';
      const newFavorite = !currentFavorite;
      
      try {
        await updateFavoriteInFirestore(answerId, newFavorite);
        // Real-time listener will update the UI automatically
      } catch (error) {
        alert('Error updating favorite: ' + error.message);
      }
    };
    
    row.querySelector('.delete-btn-table').onclick = async function() {
      const answerId = this.getAttribute('data-id');
      
      if (confirm('Are you sure you want to delete this answer?')) {
        try {
          await deleteAnswerFromFirestore(answerId);
          // Real-time listener will update the UI automatically
        } catch (error) {
          alert('Error deleting answer: ' + error.message);
        }
      }
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

async function handleFormSubmit(event) {
  event.preventDefault();
  
  const newAnswer = {
    company: document.getElementById('company').value,
    date: document.getElementById('date').value,
    question: document.getElementById('question').value,
    answer: document.getElementById('answer').value,
    favorite: false
  };
  
  try {
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Adding...';
    submitBtn.disabled = true;
    
    // Add to Firestore
    await addAnswerToFirestore(newAnswer);
    
    // Clear form
    event.target.reset();
    
    // Show success message
    alert('Answer added successfully! 🎉');
    
  } catch (error) {
    alert('Error adding answer: ' + error.message);
  } finally {
    // Reset button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Answer';
    submitBtn.disabled = false;
  }
}

function downloadJSON() {
  // Load current data and download
  loadAnswers().then(answers => {
    const dataStr = JSON.stringify(answers, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'answers.json';
    link.click();
    URL.revokeObjectURL(url);
  });
}

window.onload = async function() {
  try {
    // Wait for Firebase to be ready
    let attempts = 0;
    while (!window.firebaseDb && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!window.firebaseDb) {
      throw new Error('Firebase not initialized');
    }
    
    // Set up real-time listener
    setupRealtimeListener();
    
    // Set up form handler
    document.getElementById('add-answer-form').addEventListener('submit', handleFormSubmit);
    
    // Add download button
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '📥 Download JSON';
    downloadBtn.onclick = downloadJSON;
    downloadBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
    document.body.appendChild(downloadBtn);
    
    // Add status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.textContent = '🟢 Connected to Firebase';
    statusIndicator.style.cssText = 'position: fixed; top: 60px; right: 20px; padding: 8px; background: #28a745; color: white; border: none; border-radius: 5px; font-size: 12px;';
    document.body.appendChild(statusIndicator);
    
    console.log('✅ Firebase initialized successfully');
    
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    alert('Error connecting to database. Please refresh the page.');
  }
}; 