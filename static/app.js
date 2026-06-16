// Global State
let allReleases = [];
let selectedUpdates = new Set(); // Stores composite IDs: "entryId_updateIndex"
let activeTypeFilter = 'all';
let searchQuery = '';

// DOM Elements
const timelineContainer = document.getElementById('timeline-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const refreshBtn = document.getElementById('refresh-btn');
const refreshSpinner = document.getElementById('refresh-spinner');
const lastUpdatedTime = document.getElementById('last-updated-time');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const typeFilters = document.getElementById('type-filters');
const selectAllBtn = document.getElementById('select-all-btn');
const deselectAllBtn = document.getElementById('deselect-all-btn');
const statTotalReleases = document.getElementById('stat-total-releases');
const statTotalUpdates = document.getElementById('stat-total-updates');
const whatsappBar = document.getElementById('whatsapp-bar');
const selectedCountText = document.getElementById('selected-count-text');
const whatsappShareBtn = document.getElementById('whatsapp-share-btn');
const whatsappPreviewBtn = document.getElementById('whatsapp-preview-btn');
const retryBtn = document.getElementById('retry-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const linkedinShareBtn = document.getElementById('linkedin-share-btn');
const instagramShareBtn = document.getElementById('instagram-share-btn');

// Modal Elements
const previewModal = document.getElementById('preview-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalShareBtn = document.getElementById('modal-share-btn');
const modalCopyLinkedinBtn = document.getElementById('modal-copy-linkedin-btn');
const modalCopyInstagramBtn = document.getElementById('modal-copy-instagram-btn');
const whatsappTextPreview = document.getElementById('whatsapp-text-preview');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchReleases(false);
    setupEventListeners();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    // Default to dark theme if not set
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeToggleBtn.querySelector('span').textContent = 'dark_mode';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        themeToggleBtn.querySelector('span').textContent = 'light_mode';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const span = themeToggleBtn.querySelector('span');
    
    if (isDark) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        span.textContent = 'dark_mode';
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        span.textContent = 'light_mode';
        localStorage.setItem('theme', 'dark');
    }
}

// Event Listeners Setup
function setupEventListeners() {
    refreshBtn.addEventListener('click', () => fetchReleases(true));
    retryBtn.addEventListener('click', () => fetchReleases(true));
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        applyFilters();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
    });
    
    // Type Filters
    typeFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        
        // Remove active class from all pills
        typeFilters.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        pill.classList.add('active');
        
        activeTypeFilter = pill.dataset.type;
        applyFilters();
    });
    
    // Selection buttons
    selectAllBtn.addEventListener('click', selectAllVisible);
    deselectAllBtn.addEventListener('click', clearSelection);
    
    // Sharing buttons
    whatsappShareBtn.addEventListener('click', shareToWhatsApp);
    linkedinShareBtn.addEventListener('click', shareToLinkedIn);
    instagramShareBtn.addEventListener('click', shareToInstagram);
    whatsappPreviewBtn.addEventListener('click', openPreviewModal);
    
    // Modal
    closeModalBtn.addEventListener('click', closePreviewModal);
    modalCancelBtn.addEventListener('click', closePreviewModal);
    modalShareBtn.addEventListener('click', shareToWhatsApp);
    modalCopyLinkedinBtn.addEventListener('click', shareToLinkedIn);
    modalCopyInstagramBtn.addEventListener('click', shareToInstagram);
    
    // Close modal if clicked outside content
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) closePreviewModal();
    });
}

// Fetch releases from Flask API
async function fetchReleases(forceRefresh = false) {
    showState('loading');
    refreshSpinner.classList.add('spinner');
    refreshBtn.disabled = true;
    
    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success' || result.status === 'warning') {
            allReleases = result.data;
            
            // Update timestamp
            const date = new Date(result.last_fetched * 1000);
            lastUpdatedTime.textContent = `Updated: ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            // If warning, show warning but render data
            if (result.status === 'warning') {
                console.warn(result.message);
            }
            
            // Render
            renderTimeline();
            applyFilters();
            
            // Clear selections on full feed refresh
            if (forceRefresh) {
                clearSelection();
            }
        } else {
            showError(result.message || 'Failed to fetch release notes.');
        }
    } catch (err) {
        showError(err.message || 'Network error occurred. Please check your local server.');
    } finally {
        refreshSpinner.classList.remove('spinner');
        refreshBtn.disabled = false;
    }
}

// UI States Control
function showState(state) {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    timelineContainer.style.display = 'none';
    
    if (state === 'loading') {
        loadingState.style.display = 'flex';
    } else if (state === 'error') {
        errorState.style.display = 'flex';
    } else if (state === 'empty') {
        emptyState.style.display = 'flex';
    } else if (state === 'success') {
        timelineContainer.style.display = 'flex';
    }
}

function showError(msg) {
    showState('error');
    errorMessage.textContent = msg;
}

// Render Timeline Data (Linear-style split Date columns)
function renderTimeline() {
    timelineContainer.innerHTML = '';
    
    if (!allReleases || allReleases.length === 0) {
        showState('empty');
        return;
    }
    
    allReleases.forEach((entry) => {
        // Create Timeline Node for the day (split layout)
        const node = document.createElement('div');
        node.className = 'timeline-node';
        node.dataset.entryId = entry.id;
        
        // Left Column (Sticky Date)
        const leftCol = document.createElement('div');
        leftCol.className = 'timeline-left';
        
        const stickyDate = document.createElement('div');
        stickyDate.className = 'sticky-date';
        
        const h2 = document.createElement('h2');
        h2.textContent = entry.date;
        stickyDate.appendChild(h2);
        
        if (entry.updated) {
            const formattedTime = formatEntryTime(entry.updated);
            const badge = document.createElement('span');
            badge.className = 'date-badge';
            badge.textContent = formattedTime;
            stickyDate.appendChild(badge);
        }
        
        leftCol.appendChild(stickyDate);
        node.appendChild(leftCol);
        
        // Right Column (Stack of update cards)
        const rightCol = document.createElement('div');
        rightCol.className = 'timeline-right';
        
        entry.updates.forEach((update, idx) => {
            const cardId = `${entry.id}_${idx}`;
            const isSelected = selectedUpdates.has(cardId);
            
            const card = document.createElement('div');
            card.className = `update-card ${isSelected ? 'selected' : ''}`;
            card.dataset.cardId = cardId;
            card.dataset.type = update.type;
            
            // Checkbox Container
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'card-select-container';
            const checkbox = document.createElement('div');
            checkbox.className = 'custom-checkbox';
            const checkIcon = document.createElement('span');
            checkIcon.className = 'material-icons-round';
            checkIcon.textContent = 'check';
            checkbox.appendChild(checkIcon);
            checkboxContainer.appendChild(checkbox);
            
            // Card Content
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            
            const headerRow = document.createElement('div');
            headerRow.className = 'card-header-row';
            
            const typeBadge = document.createElement('span');
            typeBadge.className = `type-badge ${update.type.toLowerCase()}`;
            typeBadge.textContent = update.type;
            
            const quickActions = document.createElement('div');
            quickActions.className = 'card-quick-actions';
            
            const linkedinBtn = document.createElement('button');
            linkedinBtn.className = 'icon-btn-share';
            linkedinBtn.title = 'Copy and open LinkedIn';
            linkedinBtn.innerHTML = '<span class="material-icons-round">work</span>';
            linkedinBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid card toggle
                shareSingleLinkedIn(entry.date, update);
            });
            
            const instagramBtn = document.createElement('button');
            instagramBtn.className = 'icon-btn-share';
            instagramBtn.title = 'Copy and open Instagram';
            instagramBtn.innerHTML = '<span class="material-icons-round">photo_camera</span>';
            instagramBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid card toggle
                shareSingleInstagram(entry.date, update);
            });
            
            const shareBtn = document.createElement('button');
            shareBtn.className = 'icon-btn-share';
            shareBtn.title = 'Share to WhatsApp';
            shareBtn.innerHTML = '<span class="material-icons-round">chat</span>';
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid card toggle
                shareSingleUpdate(entry.date, update);
            });
            
            quickActions.appendChild(linkedinBtn);
            quickActions.appendChild(instagramBtn);
            quickActions.appendChild(shareBtn);
            headerRow.appendChild(typeBadge);
            headerRow.appendChild(quickActions);
            
            const htmlContent = document.createElement('div');
            htmlContent.className = 'card-html-content';
            htmlContent.innerHTML = update.content;
            
            cardBody.appendChild(headerRow);
            cardBody.appendChild(htmlContent);
            
            card.appendChild(checkboxContainer);
            card.appendChild(cardBody);
            
            // Toggle selection on card click
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('.icon-btn-share')) {
                    return;
                }
                toggleCardSelection(cardId);
            });
            
            rightCol.appendChild(card);
        });
        
        node.appendChild(rightCol);
        timelineContainer.appendChild(node);
    });
    
    showState('success');
}

// Helpers for Date Formatting
function formatEntryTime(updatedStr) {
    try {
        const date = new Date(updatedStr);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return '';
    }
}

// Toggle selection of single card
function toggleCardSelection(cardId) {
    const card = document.querySelector(`.update-card[data-card-id="${cardId}"]`);
    if (!card) return;
    
    if (selectedUpdates.has(cardId)) {
        selectedUpdates.delete(cardId);
        card.classList.remove('selected');
    } else {
        selectedUpdates.add(cardId);
        card.classList.add('selected');
    }
    
    updateWhatsAppBar();
}

// Select all currently visible cards
function selectAllVisible() {
    const visibleCards = document.querySelectorAll('.update-card:not([style*="display: none"])');
    visibleCards.forEach(card => {
        const cardId = card.dataset.cardId;
        if (!selectedUpdates.has(cardId)) {
            selectedUpdates.add(cardId);
            card.classList.add('selected');
        }
    });
    updateWhatsAppBar();
}

// Clear all selected cards
function clearSelection() {
    selectedUpdates.clear();
    document.querySelectorAll('.update-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateWhatsAppBar();
}

// Update floating WhatsApp bar visibility and count
function updateWhatsAppBar() {
    const count = selectedUpdates.size;
    selectedCountText.textContent = `${count} update${count !== 1 ? 's' : ''} selected`;
    
    if (count > 0) {
        whatsappBar.classList.add('visible');
    } else {
        whatsappBar.classList.remove('visible');
    }
}

// Filter and search application logic
function applyFilters() {
    let totalVisibleUpdates = 0;
    let totalVisibleNodes = 0;
    
    const nodes = document.querySelectorAll('.timeline-node');
    
    nodes.forEach(node => {
        let visibleUpdatesInNode = 0;
        const cards = node.querySelectorAll('.update-card');
        
        cards.forEach(card => {
            const type = card.dataset.type;
            const content = card.querySelector('.card-html-content').textContent.toLowerCase();
            
            const matchesType = (activeTypeFilter === 'all' || type.toLowerCase() === activeTypeFilter.toLowerCase());
            const matchesSearch = (!searchQuery || content.includes(searchQuery));
            
            if (matchesType && matchesSearch) {
                card.style.display = 'flex';
                visibleUpdatesInNode++;
                totalVisibleUpdates++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Hide timeline date header if no cards are visible for that day
        if (visibleUpdatesInNode > 0) {
            node.style.display = 'flex';
            totalVisibleNodes++;
        } else {
            node.style.display = 'none';
        }
    });
    
    // Update Stats labels
    statTotalReleases.textContent = totalVisibleNodes;
    statTotalUpdates.textContent = totalVisibleUpdates;
    
    // Toggle Empty State if nothing matches filters
    if (totalVisibleUpdates === 0 && allReleases.length > 0) {
        showState('empty');
    } else if (allReleases.length > 0) {
        showState('success');
    }
}

// HTML to WhatsApp Markdown converter
function convertHtmlToWhatsappMarkdown(html) {
    let text = html;
    
    // Replace anchor links: <a href="url">text</a> -> text (url)
    text = text.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)');
    
    // Replace strong/bold: <strong>text</strong> or <b>text</b> -> *text*
    text = text.replace(/<(?:strong|b)>(.*?)<\/(?:strong|b)>/gi, '*$1*');
    
    // Replace code blocks: <code>text</code> -> `text`
    text = text.replace(/<code>(.*?)<\/code>/gi, '`$1`');
    
    // Replace list items: <li>text</li> -> • text\n
    text = text.replace(/<li>(.*?)<\/li>/gi, '• $1\n');
    
    // Replace breaks and paragraphs
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n\n');
    text = text.replace(/<p>/gi, '');
    
    // Strip all remaining HTML tags
    text = text.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    const doc = new DOMParser().parseFromString(text, 'text/html');
    text = doc.documentElement.textContent || doc.body.textContent;
    
    // Trim extra spaces and clean lines
    text = text.split('\n').map(line => line.trim()).filter((line, i, arr) => {
        return line !== '' || (i > 0 && arr[i-1] !== ''); // Allow max one consecutive empty line
    }).join('\n');
    
    return text.trim();
}

// Compile all selected updates into WhatsApp Text Post
function generateWhatsAppText() {
    if (selectedUpdates.size === 0) return '';
    
    let message = '*BigQuery Release Notes Updates* 🚀\n\n';
    
    // Group selected updates by date
    const selectedByEntry = {};
    
    selectedUpdates.forEach(cardId => {
        const [entryId, updateIdxStr] = cardId.split('_');
        const updateIdx = parseInt(updateIdxStr);
        
        // Find entry and update
        const entry = allReleases.find(e => e.id === entryId);
        if (!entry) return;
        
        const update = entry.updates[updateIdx];
        if (!update) return;
        
        if (!selectedByEntry[entry.id]) {
            selectedByEntry[entry.id] = {
                date: entry.date,
                updates: []
            };
        }
        
        selectedByEntry[entry.id].updates.push(update);
    });
    
    // Order entries as they appear in the feed
    allReleases.forEach(entry => {
        const entryGroup = selectedByEntry[entry.id];
        if (!entryGroup || entryGroup.updates.length === 0) return;
        
        message += `📅 *${entryGroup.date}*\n`;
        
        entryGroup.updates.forEach(update => {
            const mdContent = convertHtmlToWhatsappMarkdown(update.content);
            message += `• *[${update.type}]* ${mdContent}\n\n`;
        });
        
        message += '───────────────\n\n';
    });
    
    message += '_Shared via BigQuery Changelog_';
    return message.trim();
}

// Share Selected Updates to WhatsApp
function shareToWhatsApp() {
    const text = generateWhatsAppText();
    if (!text) return;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

// Share Selected Updates to LinkedIn
function shareToLinkedIn() {
    const text = generateWhatsAppText();
    if (!text) return;
    
    copyToClipboard(text, "Changelog copied! Redirecting to LinkedIn...");
    setTimeout(() => {
        window.open('https://www.linkedin.com/feed/', '_blank');
    }, 1000);
}

// Share Selected Updates to Instagram
function shareToInstagram() {
    const text = generateWhatsAppText();
    if (!text) return;
    
    copyToClipboard(text, "Changelog copied! Redirecting to Instagram...");
    setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
    }, 1000);
}

// Share a Single Update directly to WhatsApp
function shareSingleUpdate(date, update) {
    const mdContent = convertHtmlToWhatsappMarkdown(update.content);
    const text = `*BigQuery Release Notes Update* 🚀\n\n📅 *${date}*\n• *[${update.type}]* ${mdContent}\n\n_Shared via BigQuery Changelog_`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
}

// Share a Single Update to LinkedIn
function shareSingleLinkedIn(date, update) {
    const mdContent = convertHtmlToWhatsappMarkdown(update.content);
    const text = `BigQuery Release Notes Update 🚀\n\n📅 ${date}\n• [${update.type}] ${mdContent}\n\nShared via BigQuery Changelog`;
    
    copyToClipboard(text, "Update copied! Redirecting to LinkedIn...");
    setTimeout(() => {
        window.open('https://www.linkedin.com/feed/', '_blank');
    }, 1000);
}

// Share a Single Update to Instagram
function shareSingleInstagram(date, update) {
    const mdContent = convertHtmlToWhatsappMarkdown(update.content);
    const text = `BigQuery Release Notes Update 🚀\n\n📅 ${date}\n• [${update.type}] ${mdContent}\n\nShared via BigQuery Changelog`;
    
    copyToClipboard(text, "Update copied! Redirecting to Instagram...");
    setTimeout(() => {
        window.open('https://www.instagram.com/', '_blank');
    }, 1000);
}

// Copy to Clipboard Utility
function copyToClipboard(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMessage);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showFallbackCopy(text, successMessage);
        });
    } else {
        showFallbackCopy(text, successMessage);
    }
}

// Fallback copy for non-https/older systems
function showFallbackCopy(text, successMessage) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast(successMessage);
    } catch (err) {
        console.error('Fallback copy failed: ', err);
        showToast('Failed to copy to clipboard.');
    }
    document.body.removeChild(textArea);
}

// Toast Notification Utility
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="material-icons-round" style="color: var(--primary); font-size: 16px;">check_circle</span><span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Modal management
function openPreviewModal() {
    const text = generateWhatsAppText();
    if (!text) return;
    
    whatsappTextPreview.textContent = text;
    previewModal.classList.add('open');
}

function closePreviewModal() {
    previewModal.classList.remove('open');
}
