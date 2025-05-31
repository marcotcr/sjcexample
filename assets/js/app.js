// SJC Case Database - Static Site JavaScript (Flask-style)

class CaseDatabase {
    constructor() {
        this.cases = [];
        this.filters = {};
        this.selectedTags = [];
        this.currentResults = [];
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.populateFilters();
            this.setupTagsAutocomplete();
            this.performSearch(); // Show all cases initially
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError('Failed to load case data. Please try refreshing the page.');
        }
    }
    
    async loadData() {
        const response = await fetch('data/cases.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        this.cases = data.cases;
        this.filters = data.filters;
        
        console.log(`Loaded ${this.cases.length} cases`);
    }
    
    setupEventListeners() {
        // Search form
        document.getElementById('searchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.performSearch();
        });
        
        // Real-time search on main search input
        document.getElementById('searchQuery').addEventListener('input', () => {
            this.performSearch();
        });
        
        // Real-time search on filter inputs
        const filterInputs = ['caseNumber', 'presbytery', 'caseType', 'disposition', 'yearFrom', 'yearTo', 'bcoReferences'];
        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.performSearch();
                });
                element.addEventListener('change', () => {
                    this.performSearch();
                });
            }
        });
    }
    
    populateFilters() {
        // Populate presbytery filter
        const presbyterySelect = document.getElementById('presbytery');
        this.filters.presbyteries.forEach(presbytery => {
            const option = document.createElement('option');
            option.value = presbytery;
            option.textContent = presbytery;
            presbyterySelect.appendChild(option);
        });
        
        // Populate case type filter
        const typeSelect = document.getElementById('caseType');
        this.filters.types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
        
        // Populate disposition filter
        const dispositionSelect = document.getElementById('disposition');
        this.filters.dispositions.forEach(disposition => {
            const option = document.createElement('option');
            option.value = disposition;
            option.textContent = disposition;
            dispositionSelect.appendChild(option);
        });
        
        // Populate tag datalist
        const tagsList = document.getElementById('tagsList');
        this.filters.tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            tagsList.appendChild(option);
        });
    }
    
    setupTagsAutocomplete() {
        const tagsInput = document.getElementById('tagsInput');
        const hiddenInput = document.getElementById('tags');
        const selectedTagsContainer = document.getElementById('selectedTags');
        const tagsList = document.getElementById('tagsList');
        
        const updateHiddenInput = () => {
            hiddenInput.value = this.selectedTags.join(', ');
        };
        
        const renderSelectedTags = () => {
            selectedTagsContainer.innerHTML = '';
            this.selectedTags.forEach((tag, index) => {
                const chipDiv = document.createElement('div');
                chipDiv.className = 'tag-chip';
                chipDiv.innerHTML = `
                    ${tag}
                    <button type="button" class="tag-chip-remove" onclick="app.removeTag(${index})" title="Remove tag">
                        ×
                    </button>
                `;
                selectedTagsContainer.appendChild(chipDiv);
            });
        };
        
        const addTag = (tag) => {
            if (tag && !this.selectedTags.includes(tag)) {
                this.selectedTags.push(tag);
                renderSelectedTags();
                updateHiddenInput();
                tagsInput.value = '';
                this.performSearch();
            }
        };
        
        // Make removeTag function global
        window.removeTag = (index) => {
            this.selectedTags.splice(index, 1);
            renderSelectedTags();
            updateHiddenInput();
            this.performSearch();
        };
        
        // Handle input for filtering suggestions
        tagsInput.addEventListener('input', function() {
            const inputValue = this.value.toLowerCase();
            
            // Clear existing options
            tagsList.innerHTML = '';
            
            if (inputValue.length > 0) {
                // Filter tags that haven't been selected yet
                const availableTagsFiltered = app.filters.tags.filter(tag => 
                    tag.toLowerCase().includes(inputValue) && 
                    !app.selectedTags.includes(tag)
                );
                
                // Add filtered options to datalist
                availableTagsFiltered.forEach(tag => {
                    const option = document.createElement('option');
                    option.value = tag;
                    tagsList.appendChild(option);
                });
            }
        });
        
        // Handle tag selection
        tagsInput.addEventListener('change', function() {
            const value = this.value.trim();
            if (app.filters.tags.includes(value)) {
                addTag(value);
            }
            this.value = '';
        });
    }
    
    removeTag(index) {
        this.selectedTags.splice(index, 1);
        this.setupTagsAutocomplete(); // Re-render
        this.performSearch();
    }
    
    performSearch() {
        const query = document.getElementById('searchQuery').value.toLowerCase();
        const caseNumber = document.getElementById('caseNumber').value.toLowerCase();
        const presbytery = document.getElementById('presbytery').value;
        const caseType = document.getElementById('caseType').value;
        const disposition = document.getElementById('disposition').value;
        const yearFrom = parseInt(document.getElementById('yearFrom').value) || 0;
        const yearTo = parseInt(document.getElementById('yearTo').value) || 9999;
        const bcoReferences = document.getElementById('bcoReferences').value.toLowerCase();
        
        this.currentResults = this.cases.filter(case_ => {
            // Main search query across multiple fields
            if (query) {
                const searchFields = [
                    case_.title, case_.parties, case_.summary,
                    case_.bco_rao_references, case_.source
                ].filter(field => field).join(' ').toLowerCase();
                
                if (!searchFields.includes(query)) {
                    return false;
                }
            }
            
            // Case number filter
            if (caseNumber && !case_.case_number.toLowerCase().includes(caseNumber)) {
                return false;
            }
            
            // Presbytery filter
            if (presbytery && case_.presbytery !== presbytery) {
                return false;
            }
            
            // Case type filter
            if (caseType && case_.type !== caseType) {
                return false;
            }
            
            // Disposition filter
            if (disposition && case_.disposition !== disposition) {
                return false;
            }
            
            // Year range filter
            if (case_.year_reported && (case_.year_reported < yearFrom || case_.year_reported > yearTo)) {
                return false;
            }
            
            // BCO references filter
            if (bcoReferences && (!case_.bco_rao_references || !case_.bco_rao_references.toLowerCase().includes(bcoReferences))) {
                return false;
            }
            
            // Tag filter
            if (this.selectedTags.length > 0) {
                const caseTags = case_.tags ? case_.tags.split(',').map(t => t.trim()) : [];
                const hasAllTags = this.selectedTags.every(tag => 
                    caseTags.includes(tag)
                );
                if (!hasAllTags) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.displayResults();
    }
    
    displayResults() {
        const resultsContainer = document.getElementById('resultsContainer');
        const resultsContent = document.getElementById('resultsContent');
        const resultCount = document.getElementById('resultCount');
        const noResults = document.getElementById('noResults');
        
        resultCount.textContent = this.currentResults.length;
        
        if (this.currentResults.length === 0) {
            resultsContainer.classList.add('d-none');
            noResults.classList.remove('d-none');
            return;
        }
        
        noResults.classList.add('d-none');
        resultsContainer.classList.remove('d-none');
        
        resultsContent.innerHTML = this.currentResults.map(case_ => this.renderCaseItem(case_)).join('');
    }
    
    renderCaseItem(case_) {
        const tags = case_.tags ? case_.tags.split(',').map(t => t.trim()).filter(t => t) : [];
        
        return `
            <div class="result-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="result-title mb-0">
                        <a href="case.html?id=${case_.case_number}" class="text-decoration-none">
                            ${case_.title || 'Untitled Case'}
                        </a>
                    </h5>
                    <span class="badge bg-primary ms-2">${case_.case_number}</span>
                </div>
                
                <div class="result-meta">
                    <span class="me-3"><i class="fas fa-users me-1"></i><strong>Parties:</strong> ${case_.parties || 'N/A'}</span>
                    <span class="me-3"><i class="fas fa-church me-1"></i><strong>Presbytery:</strong> ${case_.presbytery || 'N/A'}</span>
                    <span class="me-3"><i class="fas fa-gavel me-1"></i><strong>Type:</strong> ${case_.type || 'N/A'}</span>
                    <span class="me-3"><i class="fas fa-calendar me-1"></i><strong>Year:</strong> ${case_.year_reported || 'N/A'}</span>
                </div>
                
                <div class="result-meta mb-2">
                    <span class="me-3"><i class="fas fa-vote-yea me-1"></i><strong>Vote:</strong> ${case_.vote || 'N/A'}</span>
                    <span class="me-3"><i class="fas fa-balance-scale me-1"></i><strong>Disposition:</strong> ${case_.disposition || 'N/A'}</span>
                    ${case_.bco_rao_references ? `<span class="me-3"><i class="fas fa-book me-1"></i><strong>BCO/RAO:</strong> ${case_.bco_rao_references}</span>` : ''}
                </div>
                
                ${case_.summary ? `
                    <div class="result-summary">
                        <p class="mb-0">${case_.summary.substring(0, 400)}${case_.summary.length > 400 ? '...' : ''}</p>
                    </div>
                ` : ''}
                
                ${tags.length > 0 ? `
                    <div class="mt-2">
                        ${tags.map(tag => `<span class="badge badge-custom me-1">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="text-end mt-2">
                    <a href="case.html?id=${case_.case_number}" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye me-1"></i>View Details
                    </a>
                </div>
            </div>
        `;
    }
    
    showError(message) {
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.innerHTML = `<div class="alert alert-danger">${message}</div>`;
        resultsContainer.classList.remove('d-none');
    }
}

// Global functions for template compatibility
function clearFilters() {
    document.getElementById('searchForm').reset();
    app.selectedTags = [];
    app.setupTagsAutocomplete();
    app.performSearch();
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CaseDatabase();
});

// Case detail page functionality
if (window.location.pathname.includes('case.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const caseId = urlParams.get('id');
        
        if (caseId) {
            try {
                const response = await fetch(`data/cases/${caseId}.json`);
                if (response.ok) {
                    const caseData = await response.json();
                    displayCaseDetail(caseData);
                } else {
                    showCaseError('Case not found');
                }
            } catch (error) {
                showCaseError('Failed to load case data');
            }
        } else {
            showCaseError('No case ID specified');
        }
    });
}

function displayCaseDetail(case_) {
    document.title = `Case ${case_.case_number} - GA Case Search`;
    document.getElementById('caseContent').innerHTML = `
        <div class="result-item">
            <div class="text-center mb-4">
                <h1 class="mb-2">Case ${case_.case_number}</h1>
                <h2 class="text-muted">${case_.title || 'Untitled Case'}</h2>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Case Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Case Number:</strong></div>
                                <div class="col-sm-8">${case_.case_number}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Parties:</strong></div>
                                <div class="col-sm-8">${case_.parties || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Presbytery:</strong></div>
                                <div class="col-sm-8">${case_.presbytery || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Type:</strong></div>
                                <div class="col-sm-8">${case_.type || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-building me-2"></i>GA Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>GA Reported:</strong></div>
                                <div class="col-sm-8">${case_.ga_reported || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Year:</strong></div>
                                <div class="col-sm-8">${case_.year_reported || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Vote:</strong></div>
                                <div class="col-sm-8">${case_.vote || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Disposition:</strong></div>
                                <div class="col-sm-8">${case_.disposition || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-book me-2"></i>References</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Source:</strong></div>
                                <div class="col-sm-8">${case_.source || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>BCO/RAO:</strong></div>
                                <div class="col-sm-8">${case_.bco_rao_references || 'N/A'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-4"><strong>Tags:</strong></div>
                                <div class="col-sm-8">${case_.tags || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card mb-3">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-comment me-2"></i>Opinions</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Concurring Opinion:</strong></div>
                                <div class="col-sm-6">${case_.concurring_opinion ? 'Yes' : 'No'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Dissenting Opinion:</strong></div>
                                <div class="col-sm-6">${case_.dissenting_opinion ? 'Yes' : 'No'}</div>
                            </div>
                            <div class="row mb-2">
                                <div class="col-sm-6"><strong>Objection:</strong></div>
                                <div class="col-sm-6">${case_.objection ? 'Yes' : 'No'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${case_.summary ? `
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0"><i class="fas fa-file-text me-2"></i>Summary</h5>
                    </div>
                    <div class="card-body">
                        <div style="white-space: pre-wrap; line-height: 1.6;">${case_.summary}</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function showCaseError(message) {
    document.getElementById('caseContent').innerHTML = `
        <div class="alert alert-danger text-center">
            <h4>${message}</h4>
            <a href="index.html" class="btn btn-primary mt-2">← Back to Search</a>
        </div>
    `;
}
