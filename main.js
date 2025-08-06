// =============================================================================
// OA Correct Answers Tracker - Firebase Firestore Integration
// =============================================================================

// Global variables for search and pagination
let allAnswers = [];
let filteredAnswers = [];
let currentPage = 1;
const itemsPerPage = 10;

// Firebase Firestore functions
async function loadAnswers() {
  try {
    const querySnapshot = await window.firebaseGetDocs(
      window.firebaseCollection(window.firebaseDb, "answers")
    );
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
    const docRef = await window.firebaseAddDoc(
      window.firebaseCollection(window.firebaseDb, "answers"), 
      {
        company: answer.company,
        date: answer.date,
        question: answer.question,
        answer: answer.answer,
        favorite: answer.favorite,
        createdAt: new Date().toISOString()
      }
    );
    
    console.log("Answer added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding answer: ", error);
    throw error;
  }
}

async function deleteAnswerFromFirestore(answerId) {
  try {
    await window.firebaseDeleteDoc(
      window.firebaseDoc(window.firebaseDb, "answers", answerId)
    );
    console.log("Answer deleted successfully");
  } catch (error) {
    console.error("Error deleting answer: ", error);
    throw error;
  }
}

async function updateFavoriteInFirestore(answerId, isFavorite) {
  try {
    await window.firebaseUpdateDoc(
      window.firebaseDoc(window.firebaseDb, "answers", answerId), 
      {
        favorite: isFavorite
      }
    );
    console.log("Favorite updated successfully");
  } catch (error) {
    console.error("Error updating favorite: ", error);
    throw error;
  }
}

// Real-time listener for data changes
function setupRealtimeListener() {
  try {
    const unsubscribe = window.firebaseOnSnapshot(
      window.firebaseCollection(window.firebaseDb, "answers"), 
      (snapshot) => {
        const answers = [];
        snapshot.forEach((doc) => {
          answers.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        allAnswers = answers;
        applyFilters();
        updateCompanyFilter();
        renderTable(filteredAnswers, 1);
      }
    );
    
    // Store unsubscribe function for cleanup
    window.firestoreUnsubscribe = unsubscribe;
  } catch (error) {
    console.error('Error setting up real-time listener:', error);
  }
}

// =============================================================================
// Search and Filter Functions
// =============================================================================

function applyFilters() {
  const searchText = document.getElementById('search-text').value.toLowerCase();
  const companyFilter = document.getElementById('company-filter').value;
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  
  filteredAnswers = allAnswers.filter(answer => {
    // Text search
    const matchesSearch = !searchText || 
      answer.question.toLowerCase().includes(searchText) ||
      answer.answer.toLowerCase().includes(searchText) ||
      answer.company.toLowerCase().includes(searchText);
    
    // Company filter
    const matchesCompany = !companyFilter || answer.company === companyFilter;
    
    // Date range filter
    let matchesDate = true;
    if (dateFrom && answer.date < dateFrom) matchesDate = false;
    if (dateTo && answer.date > dateTo) matchesDate = false;
    
    return matchesSearch && matchesCompany && matchesDate;
  });
  
  currentPage = 1;
  renderTable(filteredAnswers, 1);
}

function updateCompanyFilter() {
  const companyFilter = document.getElementById('company-filter');
  const companies = [...new Set(allAnswers.map(answer => answer.company))].sort();
  
  // Keep current selection
  const currentValue = companyFilter.value;
  
  // Clear existing options except "All Companies"
  companyFilter.innerHTML = '<option value="">All Companies</option>';
  
  // Add company options
  companies.forEach(company => {
    const option = document.createElement('option');
    option.value = company;
    option.textContent = company;
    companyFilter.appendChild(option);
  });
  
  // Restore selection if it still exists
  if (currentValue && companies.includes(currentValue)) {
    companyFilter.value = currentValue;
  }
}

function clearFilters() {
  document.getElementById('search-text').value = '';
  document.getElementById('company-filter').value = '';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';
  applyFilters();
}

// =============================================================================
// Copy Functionality
// =============================================================================

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccessMessage('Copied to clipboard! 📋');
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showSuccessMessage('Copied to clipboard! 📋');
  }
}

// =============================================================================
// UI Rendering Functions
// =============================================================================

function renderTable(answers, page = 1) {
  const container = document.getElementById('table-container');
  container.innerHTML = '';
  
  if (answers.length === 0) {
    container.innerHTML = '<p class="no-data">No answers found. Add your first answer above!</p>';
    return;
  }
  
  // Pagination settings
  const totalPages = Math.ceil(answers.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAnswers = answers.slice(startIndex, endIndex);
  
  // Create table structure
  const table = createTableStructure();
  const tbody = createTableBody(currentAnswers);
  
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Add pagination if needed
  if (totalPages > 1) {
    const pagination = createPaginationControls(page, totalPages, answers.length);
    container.appendChild(pagination);
  }
}

function createTableStructure() {
  const table = document.createElement('table');
  table.className = 'answers-table';
  
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
  return table;
}

function createTableBody(currentAnswers) {
  const tbody = document.createElement('tbody');
  
  currentAnswers.forEach((item) => {
    const row = createTableRow(item);
    tbody.appendChild(row);
  });
  
  return tbody;
}

function createTableRow(item) {
  const row = document.createElement('tr');
  
  // Format the answer field to preserve code formatting
  const formattedAnswer = formatCodeBlock(item.answer);
  
  row.innerHTML = `
    <td>${escapeHtml(item.company)}</td>
    <td>${escapeHtml(item.date)}</td>
    <td>${escapeHtml(item.question)}</td>
    <td class="answer-cell">${formattedAnswer}</td>
    <td>
      <button class="fav-btn-table" data-id="${item.id}" data-favorite="${item.favorite}">
        ${item.favorite ? '★' : '☆'}
      </button>
    </td>
    <td>
      <button class="copy-btn-table" data-answer="${escapeHtml(item.answer)}" title="Copy Answer">📋</button>
      <button class="delete-btn-table" data-id="${item.id}" title="Delete">🗑️</button>
    </td>
  `;
  
  // Add event listeners
  addRowEventListeners(row, item);
  
  return row;
}

function addRowEventListeners(row, item) {
  // Favorite button
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
  
  // Copy button
  row.querySelector('.copy-btn-table').onclick = function() {
    const answerText = this.getAttribute('data-answer');
    copyToClipboard(answerText);
  };
  
  // Delete button
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
}

function createPaginationControls(currentPage, totalPages, totalAnswers) {
  const pagination = document.createElement('div');
  pagination.className = 'pagination';
  
  // Previous button
  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.onclick = () => renderTable(filteredAnswers, currentPage - 1);
    pagination.appendChild(prevBtn);
  }
  
  // Page numbers
  const pageInfo = document.createElement('span');
  pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalAnswers} total answers)`;
  pageInfo.className = 'page-info';
  pagination.appendChild(pageInfo);
  
  // Next button
  if (currentPage < totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.onclick = () => renderTable(filteredAnswers, currentPage + 1);
    pagination.appendChild(nextBtn);
  }
  
  return pagination;
}

function formatCodeBlock(text) {
  // Check if the text contains code-like patterns
  const codePatterns = [
    /#include/,
    /using namespace/,
    /int main/,
    /function/,
    /const/,
    /let/,
    /var/,
    /class/,
    /public/,
    /private/,
    /return/,
    /if\s*\(/,
    /for\s*\(/,
    /while\s*\(/,
    /cout/,
    /printf/,
    /console\.log/,
    /import/,
    /from/,
    /def /,
    /def\s/,
    /void/,
    /int\s/,
    /string/,
    /vector/,
    /array/,
    /std::/,
    /namespace/,
    /template/,
    /typename/
  ];
  
  const hasCodePattern = codePatterns.some(pattern => pattern.test(text));
  
  if (hasCodePattern) {
    // Format as code block
    return `<pre class="code-block">${escapeHtml(text)}</pre>`;
  } else {
    // Format as regular text with line breaks
    return text.split('\n').map(line => 
      line.trim() ? `<div class="text-line">${escapeHtml(line)}</div>` : '<div class="text-line"><br></div>'
    ).join('');
  }
}

// =============================================================================
// Form Handling Functions
// =============================================================================

async function handleFormSubmit(event) {
  event.preventDefault();
  
  const newAnswer = {
    company: document.getElementById('company').value.trim(),
    date: document.getElementById('date').value,
    question: document.getElementById('question').value.trim(),
    answer: document.getElementById('answer').value.trim(),
    favorite: false
  };
  
  // Validate required fields
  if (!newAnswer.company || !newAnswer.date || !newAnswer.question || !newAnswer.answer) {
    alert('Please fill in all fields');
    return;
  }
  
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
    showSuccessMessage('Answer added successfully! 🎉');
    
  } catch (error) {
    showErrorMessage('Error adding answer: ' + error.message);
  } finally {
    // Reset button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Add Answer';
    submitBtn.disabled = false;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #28a745;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
  `;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

function showErrorMessage(message) {
  alert(message);
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

// =============================================================================
// Initialization
// =============================================================================

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
    
    // Set up search handlers
    document.getElementById('search-btn').addEventListener('click', applyFilters);
    document.getElementById('clear-search-btn').addEventListener('click', clearFilters);
    
    // Set up search input handlers (search as you type)
    document.getElementById('search-text').addEventListener('input', applyFilters);
    document.getElementById('company-filter').addEventListener('change', applyFilters);
    document.getElementById('date-from').addEventListener('change', applyFilters);
    document.getElementById('date-to').addEventListener('change', applyFilters);
    
    // Add UI elements
    addUIElements();
    
    console.log('✅ Firebase initialized successfully');
    
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    showErrorMessage('Error connecting to database. Please refresh the page.');
  }
};

function addUIElements() {
  // Add download button
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = '📥 Download JSON';
  downloadBtn.onclick = downloadJSON;
  downloadBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  document.body.appendChild(downloadBtn);
  
  // Add status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.textContent = '🟢 Connected to Firebase';
  statusIndicator.style.cssText = `
    position: fixed;
    top: 60px;
    right: 20px;
    padding: 8px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 12px;
  `;
  document.body.appendChild(statusIndicator);
} 