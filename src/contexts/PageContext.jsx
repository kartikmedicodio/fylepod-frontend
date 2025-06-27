import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const PageContext = createContext();

export const PageProvider = ({ children }) => {
  const [pageTitle, setPageTitle] = useState('');

  return (
    <PageContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageContext.Provider>
  );
};

PageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const usePage = () => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
}; 