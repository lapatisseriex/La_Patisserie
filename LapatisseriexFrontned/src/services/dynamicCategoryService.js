/**
 * API method to fetch dynamic category images
 */
export const fetchDynamicCategoryImages = () => {
  return api.get('/dynamic-categories')
    .then(response => response.data)
    .catch(error => {
      console.error('Error fetching dynamic category images:', error);
      return null;
    });
};