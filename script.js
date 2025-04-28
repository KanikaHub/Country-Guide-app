const countriesContainer = document.getElementById('countriesContainer');
const searchInput = document.getElementById('searchInput');
const regionFilter = document.getElementById('regionFilter');
const populationFilter = document.getElementById('populationFilter');
const darkModeToggle = document.getElementById('darkModeToggle');
const pagination = document.getElementById('pagination');
const modalElement = document.getElementById('countryModal');
const modalContent = document.getElementById('modalContent');

let countriesData = [];
let filteredCountries = [];
let bootstrapModal = null;

const itemsPerPage = 20;
let currentPage = 1;

// Show loading indicator
function showLoading() {
    countriesContainer.innerHTML = '<p class="text-center">Loading countries data...</p>';
}

// Initial fetch function
async function fetchCountries() {
    showLoading();
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        countriesData = data;
        filteredCountries = countriesData;
        currentPage = 1;
        displayCountriesPage(currentPage);
        setupPagination();
    } catch (error) {
        countriesContainer.innerHTML = `<p class="text-danger">Failed to load countries data: ${error.message}</p>`;
    }
}

// Display countries for the current page
function displayCountriesPage(page) {
    countriesContainer.innerHTML = '';

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const countriesToDisplay = filteredCountries.slice(startIndex, endIndex);

    if (!countriesToDisplay || countriesToDisplay.length === 0) {
        countriesContainer.innerHTML = '<p class="text-center">No countries found.</p>';
        return;
    }

    countriesToDisplay.forEach(country => {
        const countryCard = document.createElement('div');
        countryCard.classList.add('col-sm-6', 'col-md-4', 'col-lg-3');

        countryCard.innerHTML = `
            <div class="card h-100 shadow-sm country-card" data-country="${country.cca3}" tabindex="0" role="button" aria-pressed="false" aria-label="View details for ${country.name?.common || 'Unknown'}">
                <img src="${country.flags?.svg || ''}" class="card-img-top" alt="Flag of ${country.name?.common || 'Unknown'}" />
                <div class="card-body">
                    <h5 class="card-title">${country.name?.common || 'Unknown'}</h5>
                    <p class="card-text"><strong>Region:</strong> ${country.region || 'N/A'}</p>
                    <p class="card-text"><strong>Population:</strong> ${country.population ? country.population.toLocaleString() : 'N/A'}</p>
                </div>
            </div>
        `;

        countriesContainer.appendChild(countryCard);

        // Keyboard accessibility: open modal on Enter or Space key
        countryCard.querySelector('.country-card').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showCountryDetails(country);
            }
        });

        // Click event to show details
        countryCard.querySelector('.country-card').addEventListener('click', () => {
            showCountryDetails(country);
        });
    });
}
// Show country details in modal
function showCountryDetails(country) {
    if (!modalContent || !modalElement) return;

    const languages = country.languages ? Object.values(country.languages).join(', ') : 'N/A';
    const currencies = country.currencies ? Object.values(country.currencies).map(c => c.name).join(', ') : 'N/A';
    const capital = country.capital ? country.capital.join(', ') : 'N/A';
    const subregion = country.subregion || 'N/A';
    const area = country.area ? country.area.toLocaleString() + ' km²' : 'N/A';

    modalContent.innerHTML = `
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-6">
                    <img src="${country.flags?.svg || ''}" alt="Flag of ${country.name?.common || 'Unknown'}" class="img-fluid mb-3" />
                </div>
                <div class="col-md-6">
                    <h3>${country.name?.common || 'Unknown'}</h3>
                    <p><strong>Official Name:</strong> ${country.name?.official || 'N/A'}</p>
                    <p><strong>Capital:</strong> ${capital}</p>
                    <p><strong>Region:</strong> ${country.region || 'N/A'}</p>
                    <p><strong>Subregion:</strong> ${subregion}</p>
                    <p><strong>Population:</strong> ${country.population ? country.population.toLocaleString() : 'N/A'}</p>
                    <p><strong>Area:</strong> ${area}</p>
                    <p><strong>Languages:</strong> ${languages}</p>
                    <p><strong>Currencies:</strong> ${currencies}</p>
                </div>
            </div>
        </div>
    `;

    if (!bootstrapModal) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrapModal = new bootstrap.Modal(modalElement);
        } else {
            console.error('Bootstrap Modal is not available.');
            return;
        }
    }
    bootstrapModal.show();
}

// Filter countries based on search, region, and population
function filterCountries() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedRegion = regionFilter.value;
    const selectedPopulation = populationFilter.value;

    filteredCountries = countriesData.filter(country => {
        const matchesSearch = country.name?.common?.toLowerCase().includes(searchTerm);
        const matchesRegion = selectedRegion ? country.region === selectedRegion : true;

        let matchesPopulation = true;
        if (selectedPopulation === 'lt1m') {
            matchesPopulation = country.population < 1000000;
        } else if (selectedPopulation === '1m-10m') {
            matchesPopulation = country.population >= 1000000 && country.population <= 10000000;
        } else if (selectedPopulation === 'gt10m') {
            matchesPopulation = country.population > 10000000;
        }

        return matchesSearch && matchesRegion && matchesPopulation;
    });

    currentPage = 1;
    displayCountriesPage(currentPage);
    setupPagination();
}

// Setup pagination controls
function setupPagination() {
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);
    if (totalPages <= 1) {
        return;
    }

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.classList.add('page-item');
    if (currentPage === 1) {
        prevLi.classList.add('disabled');
    }
    const prevLink = document.createElement('a');
    prevLink.classList.add('page-link');
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '&laquo;';
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            displayCountriesPage(currentPage);
            setupPagination();
            countriesContainer.scrollIntoView({ behavior: 'smooth' });
        }
    });
    prevLi.appendChild(prevLink);
    pagination.appendChild(prevLi);

    // Page number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.classList.add('page-item');
        if (i === currentPage) {
            pageLi.classList.add('active');
        }
        const pageLink = document.createElement('a');
        pageLink.classList.add('page-link');
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.setAttribute('aria-label', `Page ${i}`);
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            displayCountriesPage(currentPage);
            setupPagination();
            countriesContainer.scrollIntoView({ behavior: 'smooth' });
        });
        pageLi.appendChild(pageLink);
        pagination.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.classList.add('page-item');
    if (currentPage === totalPages) {
        nextLi.classList.add('disabled');
    }
    const nextLink = document.createElement('a');
    nextLink.classList.add('page-link');
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '&raquo;';
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            displayCountriesPage(currentPage);
            setupPagination();
            countriesContainer.scrollIntoView({ behavior: 'smooth' });
        }
    });
    nextLi.appendChild(nextLink);
    pagination.appendChild(nextLi);
}

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        darkModeToggle.textContent = 'Light Mode';
        darkModeToggle.setAttribute('aria-pressed', 'true');
    } else {
        darkModeToggle.textContent = 'Dark Mode';
        darkModeToggle.setAttribute('aria-pressed', 'false');
    }
}

// Event listeners
searchInput.addEventListener('input', filterCountries);
regionFilter.addEventListener('change', filterCountries);
populationFilter.addEventListener('change', filterCountries);
darkModeToggle.addEventListener('click', toggleDarkMode);

// Initial fetch
fetchCountries();
