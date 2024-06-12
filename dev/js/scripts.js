const openFilterFormBtn = document.getElementById('open__filter__form__btn');
const toolsSection = document.getElementById('tools');
const toolsFormContainer = document.getElementById('tools__form__container');
const toolsFormCloseBtn = document.getElementById('tools__form__close__btn');
const toolsFormStatus = document.getElementById('tools__form__status');
const toolsFormStatusMessage = document.getElementById('tools__form__status__message');
const toolsForm = document.getElementById('tools__form');
const toolsPagination = document.getElementById('tools__pagination');
const toolsGrid = document.getElementById('tools__grid');
const toolCardTemplate = document.getElementById('tool-card');
const toolCategoryLinkTemplate = document.getElementById('tool-category-link');
const toolPaginationLinkTemplate = document.getElementById('tool-pagination-link');
const toolPaginationContainer = document.getElementById('tools__pagination');
const toolsFilterBtn = document.getElementById('tools__filter__btn');
const toolsClearBtn = document.getElementById('tools__clear__btn');
const config = {
  'TOOLS_PER_PAGE' : 8,
  'TOOLS_FEATURED_IMGS_PATH' : './assets/images/featured-tools/',
  'TOOLS_DEFAULT_IMG' : 'default.png',
  'VALID_FILTERS' : ['tool_name', 'category', 'author_name', 'author_country', 'page'],
  'STATUS_MESSAGES' : {
    'emptyForm' : 'Provide an input to at least one field to filter the tools.',
    'invalidFields' : "The data you're trying to send comes from one or more invalid fields.",
    'noResults' : "There are no results matching your filter criteria."
  }
};

function handleFilterFormOpen() {
  openFilterFormBtn.classList.add('go__off__screen', 'transition__translate__eo');
  openFilterFormBtn.addEventListener('transitionend', showFilterForm, { once: true });
}

function showFilterForm() {
  document.body.classList.add('overflow-hidden', 'overlay');
  toolsFormContainer.classList.add('show', 'transition__translate__eo');
}

function handleFilterFormClose() {
  toolsFormContainer.classList.remove('show', 'transition__translate__eo');
  if (!toolsFormStatus.classList.contains('hide')) toolsFormStatus.classList.add('hide');
  toolsFormContainer.addEventListener('transitionend', hideFilterForm, { once: true });
}

function hideFilterForm() {
  document.body.classList.remove('overflow-hidden', 'overlay');
  openFilterFormBtn.classList.remove('go__off__screen', 'transition__translate__eo');
}

// Create helper functions to populate dropdown fields.
function createOption(text, value, urlParams, htmlEl) {
  const optionEl = document.createElement('option');
  optionEl.value = value;
  optionEl.innerText = text;
  if (urlParams.size > 0 && urlParams.has(htmlEl.name) && urlParams.get(htmlEl.name) === turnToSlug(value)) optionEl.selected = true;
  return optionEl;
}

function populateDropdown(elementId, values, urlParams) {
  const element = document.getElementById(elementId);
  const docFragment = document.createDocumentFragment();

  // Add an empty option as the first item.
  docFragment.appendChild(createOption('---', '', urlParams, element));

  for (const value of values) {
    docFragment.appendChild(createOption(value, value, urlParams, element));
  }

  element.appendChild(docFragment);
}

function turnToSlug(textToBeSlugged) {
  return textToBeSlugged.toLowerCase().replace(/\s/g, '-');
}

function isValueEmpty(value) {
  return value === '';
}

function cleanValue(value) {
  return encodeURIComponent(value.replace(/<\/?[a-z]+((\s[a-z]+=".+")+)?>/g, '')).replace(/%20/g, ' ').replace(/%2522/g, '').trim();
}

function showHideStatusMessage(timerId, message, timeToGoAway = null) {
  toolsFormStatusMessage.innerText = message;
  toolsFormStatus.classList.remove('hide');
  toolsFormContainer.scrollTop = toolsFormContainer.scrollTopMax;
  if (timeToGoAway) {
    timerId = setTimeout(function () {
      toolsFormStatus.classList.add('hide');
      clearTimeout(timerId);
    }, timeToGoAway);
  }
  return timerId;
}

function getCriterion(toolItem, filterKey, filterValue) {
  switch (filterKey) {
    case config['VALID_FILTERS'][0]:
      return turnToSlug(toolItem['info']['name']).includes(filterValue);
    case config['VALID_FILTERS'][1]:
      return toolItem['info']['categories'].map(category => turnToSlug(category)).includes(filterValue);
    case config['VALID_FILTERS'][2]:
      return turnToSlug(toolItem['author']['name']) === filterValue;
    case config['VALID_FILTERS'][3]:
      return turnToSlug(toolItem['author']['country']) === filterValue;
  }
}

function getContainerOfCategories(categoriesCollection) {
  const categoriesFragment = document.createDocumentFragment();

  for (const category of categoriesCollection) {
    //create categories from template
    const toolCategoryLinkClone = toolCategoryLinkTemplate.content.cloneNode(true);
    const toolCategoryLinkEl = toolCategoryLinkClone.querySelector('.tools__card__category');
    toolCategoryLinkEl.href += turnToSlug(category);
    toolCategoryLinkEl.innerText = category;
    categoriesFragment.appendChild(toolCategoryLinkEl);
  }

  return categoriesFragment;
}

function createToolCard(toolItem) {
  const toolCardClone = toolCardTemplate.content.cloneNode(true);
  const toolCardEl = toolCardClone.querySelector('.tools__card');
  const toolFeaturedImg = toolCardEl.querySelector('.tools__featured__img');
  const toolNameLink = toolCardEl.querySelector('.tools__card__name__link');
  const toolDescription = toolCardEl.querySelector('.tools__card__description');
  const toolAuthor = toolCardEl.querySelector('.tools__card__author');
  const toolCategories = toolCardEl.querySelector('.tools__card__categories');
  const imgName = toolItem['featuredImg']['name'] !== '' ? toolItem['featuredImg']['name'] : config['TOOLS_DEFAULT_IMG'];

  toolFeaturedImg.src = config['TOOLS_FEATURED_IMGS_PATH'] + imgName;
  toolFeaturedImg.alt = toolItem['featuredImg']['alternativeText'];
  toolNameLink.href = toolItem['info']['link'];
  toolNameLink.innerText = toolItem['info']['name'];
  toolDescription.innerText = toolItem['info']['description'];
  toolAuthor.href += toolItem['author']['email'];
  toolAuthor.innerText = toolItem['author']['name'];
  toolCardEl.dataset['authorCountry'] = toolItem['author']['country'];

  toolCategories.appendChild(getContainerOfCategories(toolItem['info']['categories']));

  return toolCardEl;
}

function getContainerOfTools(toolsList, urlParams, toolsQty) {
  const toolsFragment = document.createDocumentFragment();

  //Limit the creation of cards
  let minToolCardIdx = getMinToolIdx(urlParams);
  let maxToolCardIdx = getMaxToolIdx(minToolCardIdx, toolsQty);

  while (minToolCardIdx < maxToolCardIdx) {
    const toolCardEl = createToolCard(toolsList[minToolCardIdx]);
    toolsFragment.appendChild(toolCardEl);
    minToolCardIdx++;
  }

  return toolsFragment;
}

function getContainerPagination(pagesQty) {
  const pagesLinksFragment = document.createDocumentFragment();
  let paginationLinkIdx = 0;

  while (paginationLinkIdx < pagesQty) {
    const toolPaginationLinkClone = toolPaginationLinkTemplate.content.cloneNode(true);
    const toolPaginationLinkEl = toolPaginationLinkClone.querySelector('.tools__pagination__link');
    toolPaginationLinkEl.href += paginationLinkIdx + 1;
    toolPaginationLinkEl.innerText = paginationLinkIdx + 1;

    pagesLinksFragment.appendChild(toolPaginationLinkEl);

    paginationLinkIdx++;
  }

  return pagesLinksFragment;
}

function getMinToolIdx(urlParams) {
  if (!urlParams.has(config['VALID_FILTERS'][4])) return 0;
  return config['TOOLS_PER_PAGE'] * parseInt(urlParams.get(config['VALID_FILTERS'][4])) - config['TOOLS_PER_PAGE'];
}

function getMaxToolIdx(minToolIdx, toolsQty) {
  if (toolsQty < config['TOOLS_PER_PAGE']) return toolsQty;
  return minToolIdx + config['TOOLS_PER_PAGE'] < toolsQty ? minToolIdx + config['TOOLS_PER_PAGE'] : toolsQty - 1;
}

function getFilteredToolList(toolList, requirements) {
  return toolList.filter(tool => {
    return requirements.some(data => {
      const [key, value] = data;
      return getCriterion(tool, key, value);
    });
  });
}

openFilterFormBtn.addEventListener('click', handleFilterFormOpen);
toolsFormCloseBtn.addEventListener('click', handleFilterFormClose);

async function getJSONtoolsList() {
  try {
    const resp = await fetch('./assets/js/tools.json');
    if (!resp.ok) throw new Error('Something went wrong. Wait a moment and refresh the page.');
    return await resp.json();
  } catch (error) {
    // TODO: improve the way error should be displayed
	  console.error(error);
  }
}

async function main() {
  try {
    const jsonToolsList = await getJSONtoolsList();
    //Sort tools alphabetically by name
    let sortedToolsList = jsonToolsList.sort((a, b) => a['info']['name'].toLowerCase() < b['info']['name'].toLowerCase() ? -1 : 1);
    let qtyOfTools = sortedToolsList.length;
    let qtyOfPages = Math.ceil(qtyOfTools / config['TOOLS_PER_PAGE']);
  
    //TODO: Filter tools if needed when the page loads
    let url = new URL(document.location);
    let params = url.searchParams;
    let criteria;
    let filteredToolsList;
  
    //If the page loaded with any search params
    if (params.size > 0) {
      for (const entry of [...params.entries()]) {
        //Get rid of empty or invalid keys and...
        if (entry[1] === '' || !config['VALID_FILTERS'].includes(entry[0])) {
          params.delete(entry[0]);
        //...sanitize the rest
        } else {
          params.set(entry[0], turnToSlug(cleanValue(entry[1])));
        }
      }
  
      if (params.has(config['VALID_FILTERS'][4])) {      
        if (params.size >= 2) criteria = [...params.entries()].filter(entry => entry[0] !== config['VALID_FILTERS'][4]);
      } else {
        criteria = [...params.entries()];
      }
  
      //Check if there are any tools according to the search params
      if (criteria) {
        filteredToolsList = getFilteredToolList(sortedToolsList, criteria);
        qtyOfTools = filteredToolsList.length;
        qtyOfPages = Math.ceil(qtyOfTools / config['TOOLS_PER_PAGE']);
      }
  
      //Set behavior for "page" param in case of invalid values.
      if (params.has(config['VALID_FILTERS'][4]) && parseInt(params.get(config['VALID_FILTERS'][4])) > qtyOfPages || isNaN(parseInt(params.get(config['VALID_FILTERS'][4])))) {
        params.delete(config['VALID_FILTERS'][4]);
      }
  
      history.replaceState(JSON.stringify(params), '', url);
  
      toolsSection.scrollIntoView();
    }
  
    if (qtyOfTools > config['TOOLS_PER_PAGE'] || params.size > 0) {
      openFilterFormBtn.classList.remove('hide');
      toolsFormContainer.classList.remove('hide');
  
      //Actions to take place when viewport with is greater than 1012px
      if (!window.matchMedia('(min-width: 63.25rem)').matches) {
        const intersectionObsOption = {
          rootMargin: '0px 0px -50% 0px',
        };
  
        const intObserver = new IntersectionObserver(entries => {
          openFilterFormBtn.classList.toggle('go__off__screen', !entries[0].isIntersecting);
        }, intersectionObsOption);
  
        intObserver.observe(toolsSection);
      }
  
      // Populate dropdown fields.
      const categories = [...new Set(sortedToolsList.flatMap(tool => tool.info.categories))].sort();
      const authorNames = [...new Set(sortedToolsList.flatMap(tool => tool.author.name))].sort();
      const authorCountries = [...new Set(sortedToolsList.flatMap(tool => tool.author.country))].sort();
  
      populateDropdown('category', categories, params);
      populateDropdown('author-name', authorNames, params);
      populateDropdown('author-country', authorCountries, params);
    }
  
    if (qtyOfTools > config['TOOLS_PER_PAGE']) {    
      //Create cards
      let toolSet = filteredToolsList !== undefined ? filteredToolsList : sortedToolsList;
      toolsGrid.appendChild(getContainerOfTools(toolSet, params, qtyOfTools));
  
      //Create pagination
      toolPaginationContainer.appendChild(getContainerPagination(qtyOfPages));
  
      if (params.has(config['VALID_FILTERS'][4]) && parseInt(params.get(config['VALID_FILTERS'][4])) >= 2) {
        toolsPagination.children[parseInt(params.get(config['VALID_FILTERS'][4])) - 1].classList.add('selected');
      } else {
        toolsPagination.children[0].classList.add('selected');
      }
  
      toolPaginationContainer.classList.remove('hide');
    } else {
      //Create cards
      let toolSet = filteredToolsList !== undefined ? filteredToolsList : sortedToolsList;
      toolsGrid.appendChild(getContainerOfTools(toolSet, params, qtyOfTools));
    }
  
    //Make the form functional
    let timeOutId;
  
    toolsFilterBtn.addEventListener('click', () => {
      const toolsFormData = new FormData(toolsForm);
      const isFormEmpty = [...toolsFormData.values()].every(isValueEmpty);
  
      if(isFormEmpty) {
        if (timeOutId) return;
        showHideStatusMessage(timeOutId, config['STATUS_MESSAGES']['emptyForm'], 7500);
        return;
      }
  
      //Sanitize values and get rid of empty values
      for (const entry of [...toolsFormData.entries()]) {
        if(entry[1] !== '') {
          //clean input values
          toolsFormData.set(entry[0], turnToSlug(cleanValue(entry[1])));
        } else {
          //get rid of empty values
          toolsFormData.delete(entry[0]);
        }
      }
  
      //Check if any of the nonEmptyFields matches any of the valid filters
      const areKeysIncludedinValidFilters = [...toolsFormData.keys()].every(key => config['VALID_FILTERS'].includes(key));
  
      if(!areKeysIncludedinValidFilters) {
        if (timeOutId) return;
        showHideStatusMessage(timeOutId, config['STATUS_MESSAGES']['invalidFields'], 7500);
        return;
      }
  
      //Check if there are tools according to the input submitted
      filteredToolsList = getFilteredToolList(sortedToolsList, [...toolsFormData.entries()]);
  
      //If there are no results, show correspondant status message
      if(filteredToolsList.length === 0) {
        if (timeOutId) return;
        showHideStatusMessage(timeOutId, config['STATUS_MESSAGES']['noResults'], 7500);
        return;
      }
  
      //If there are any results...
      //Update URL with input values from the filter
      params = url.searchParams;
  
      //Check if there are any Search Params in the current URL
      if (params.size > 0) {
        //Delete any search param that's not present in the upcoming filter request
        for (const paramKey of [...params.keys()]) {
          if (![...toolsFormData.keys()].includes(paramKey)) params.delete(paramKey);
        }       
      }
  
      //Set search param(s)
      for (const entry of [...toolsFormData.entries()]) {
        params.set(entry[0], entry[1]);
      }
  
      location.href = url.href;
    });
  
    toolsClearBtn.addEventListener('click', () => {
      location.href = url.origin + url.pathname;
    })
  } catch (error) {
    // TODO: improve the way error should be displayed
	  console.error(error);
  }
};

main();
