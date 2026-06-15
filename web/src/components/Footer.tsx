export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <span className="text-2xl font-bold text-white mb-4 block">StockVision <span className="text-primary-500">AI</span></span>
            <p className="text-gray-400 max-w-sm mb-6">
              Democratizing institutional-grade stock analysis and AI-powered trading intelligence for retail investors across US and Indonesia markets.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:text-primary-500 cursor-pointer transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-primary-500 transition-colors">Real-Time Charts</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">AI Analysis</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">Virtual Trading</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">News Hub</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-primary-500 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">GDPR</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">PDP Law</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-surface-border text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} StockVision AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
