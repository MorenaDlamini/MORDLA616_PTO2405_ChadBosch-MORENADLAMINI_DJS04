import { books, authors, genres, BOOKS_PER_PAGE } from './data.js';

// ====================
// App State
// ====================
let page = 1;
let matches = books;

// ====================
// Initialization
// ====================
document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});

/**
 * Initializes the application: renders books, populates dropdowns, sets theme, and adds event listeners.
 */
function initializeApp() {
    renderBookList(matches.slice(0, BOOKS_PER_PAGE));
    populateDropdowns();
    setupTheme();
    attachEventListeners();
}

// ====================
// Rendering Functions
// ====================

/**
 * Renders a list of books in the UI.
 * @param {Array<Object>} booksToRender - The list of books to render.
 */
function renderBookList(booksToRender) {
    const listContainer = document.querySelector("[data-list-items]");
    listContainer.innerHTML = "";
    const fragment = document.createDocumentFragment();

    booksToRender.forEach(({ author, id, image, title }) => {
        const bookPreview = new BookPreview();
        bookPreview.setAttribute('data-preview', id);
        bookPreview.setAttribute('image', image);
        bookPreview.setAttribute('title', title);
        bookPreview.setAttribute('author', authors[author]);
        fragment.appendChild(bookPreview);
    });

    listContainer.appendChild(fragment);
}

/**
 * Populates the genre and author dropdowns with options.
 */
function populateDropdowns() {
    populateDropdown("[data-search-genres]", genres, "All Genres");
    populateDropdown("[data-search-authors]", authors, "All Authors");
}

/**
 * Populates a dropdown with options.
 * @param {string} selector - The CSS selector for the dropdown element.
 * @param {Object} data - The data to populate the dropdown with (key-value pairs).
 * @param {string} defaultOption - The default option to display in the dropdown.
 */
function populateDropdown(selector, data, defaultOption) {
    const dropdown = document.querySelector(selector);
    dropdown.innerHTML = `<option value="any">${defaultOption}</option>`;

    Object.entries(data).forEach(([id, name]) => {
        const option = document.createElement("option");
        option.value = id;
        option.innerText = name;
        dropdown.appendChild(option);
    });
}

// ====================
// Theme Management
// ====================

/**
 * Sets up the theme based on the user's system preference.
 */
function setupTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'night' : 'day');
}

/**
 * Applies the selected theme to the application.
 * @param {string} theme - The theme to apply ('night' or 'day').
 */
function setTheme(theme) {
    const darkMode = theme === 'night';
    document.documentElement.style.setProperty('--color-dark', darkMode ? '255, 255, 255' : '10, 10, 20');
    document.documentElement.style.setProperty('--color-light', darkMode ? '10, 10, 20' : '255, 255, 255');
}

// ====================
// Event Handling
// ====================

/**
 * Attaches event listeners to various UI elements.
 */
function attachEventListeners() {
    // Header and Dialog Interactions
    document.querySelector(".header__logo").addEventListener("click", () => location.reload());
    document.querySelector("[data-header-search]").addEventListener("click", () => toggleDialog("[data-search-overlay]", true));
    document.querySelector("[data-header-settings]").addEventListener("click", () => toggleDialog("[data-settings-overlay]", true));
    document.querySelector("[data-list-close]").addEventListener("click", () => toggleDialog("[data-list-active]", false));
    document.querySelector("[data-settings-cancel]").addEventListener("click", () => toggleDialog("[data-settings-overlay]", false));
    document.querySelector("[data-search-cancel]").addEventListener("click", () => toggleDialog("[data-search-overlay]", false));

    // Form Submissions
    document.querySelector("[data-settings-form]").addEventListener("submit", handleThemeChange);
    document.querySelector("[data-search-form]").addEventListener("submit", handleSearch);

    // Book Interactions
    document.querySelector("[data-list-items]").addEventListener("click", handleBookSelection);
    document.querySelector("[data-list-button]").innerText = "Load more";
    document.querySelector("[data-list-button]").addEventListener("click", loadMoreBooks);
}

/**
 * Handles the theme change event.
 * @param {Event} event - The form submission event.
 */
function handleThemeChange(event) {
    event.preventDefault();
    const theme = new FormData(event.target).get("theme");
    setTheme(theme);
    toggleDialog("[data-settings-overlay]", false);
}

/**
 * Handles the search form submission and filters books based on search criteria.
 * @param {Event} event - The form submission event.
 */
function handleSearch(event) {
    page = 1;
    event.preventDefault();
    const filters = Object.fromEntries(new FormData(event.target));
    matches = books.filter(book => 
        (filters.title.trim() === "" || book.title.toLowerCase().includes(filters.title.toLowerCase())) &&
        (filters.author === "any" || book.author === filters.author) &&
        (filters.genre === "any" || book.genres.includes(filters.genre))
    );

    document.querySelector("[data-list-message]").classList.toggle("list__message_show", matches.length < 1);
    renderBookList(matches.slice(0, BOOKS_PER_PAGE));
    toggleDialog("[data-search-overlay]", false);
}

/**
 * Loads more books into the list, prioritizing similar authors/genres.
 */
function loadMoreBooks() {
    page++;
    const lastLoadedBook = matches[(page - 1) * BOOKS_PER_PAGE - 1];
    let additionalBooks = books.filter(book => 
        book.author === lastLoadedBook.author || 
        book.genres.some(genre => lastLoadedBook.genres.includes(genre))
    );
    
    matches = [...matches, ...additionalBooks];
    page++;
    renderBookList(matches.slice(0, page * BOOKS_PER_PAGE));
}

/**
 * Handles the selection of a book and displays its details in an overlay.
 * @param {Event} event - The click event.
 */
function handleBookSelection(event) {
    const target = event.target.closest("book-preview");
    if (!target) return;
    const bookId = target.getAttribute('data-preview');
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    document.querySelector("[data-list-active]").open = true;
    document.querySelector("[data-list-blur]").src = book.image;
    document.querySelector("[data-list-image]").src = book.image;
    document.querySelector("[data-list-title]").innerText = book.title;
    document.querySelector("[data-list-subtitle]").innerText = `${authors[book.author]} (${new Date(book.published).getFullYear()})`;
    document.querySelector("[data-list-description]").innerText = book.description;
}

// ====================
// Utility Functions
// ====================

/**
 * Toggles the visibility of a dialog element.
 * @param {string} selector - The CSS selector for the dialog element.
 * @param {boolean} show - Whether to show or hide the dialog.
 */
function toggleDialog(selector, show) {
    document.querySelector(selector).open = show;
}

// ====================
// Web Components
// ====================

/**
 * Base class for book-related components.
 */
class BaseBookComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Renders the component's content.
     */
    render() {
        const image = this.getAttribute('image');
        const title = this.getAttribute('title');
        const author = this.getAttribute('author');

        this.shadowRoot.innerHTML = `
            <style>
                .preview {
                    border-width: 0;
                    width: 100%;
                    font-family: Roboto, sans-serif;
                    padding: 0.5rem 1rem;
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    text-align: left;
                    border-radius: 8px;
                    border: 1px solid rgba(var(--color-light), 0.15);
                    background: rgba(var(--color-light), 0.05);
                }
                .preview__image {
                    width: 48px;
                    height: 70px;
                    object-fit: cover;
                    margin-right: 1rem;
                    border-radius: 2px;
                    box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2),
                                0px 1px 1px 0px rgba(0, 0, 0, 0.1),
                                0px 1px 3px 0px rgba(0, 0, 0, 0.1);
                }
                .preview__info {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .preview__title {
                    margin: 0 0 0.3rem;
                    font-weight: bold;
                    font-size: 0.8rem;
                    color: rgba(var(--color-dark), 0.8)
                }
                .preview__author {
                    font-size: 0.7rem;
                    color: rgba(var(--color-dark), 0.4)
                }
            </style>
            <button class="preview">
                <img class="preview__image" src="${image}" />
                <div class="preview__info">
                    <h3 class="preview__title">${title}</h3>
                    <div class="preview__author">${author}</div>
                </div>
            </button>
        `;
    }
}

/**
 * Book Preview Web Component.
 */
class BookPreview extends BaseBookComponent {
    /**
     * Called when the element is added to the DOM.
     */
    connectedCallback() {
        this.render();
    }
}

customElements.define('book-preview', BookPreview);