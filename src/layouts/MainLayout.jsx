const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm h-16">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Document Management System
          </h1>
        </div>
      </header>
      <main className="h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
};

export default MainLayout; 