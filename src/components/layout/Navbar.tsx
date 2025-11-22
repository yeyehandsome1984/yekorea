import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Book, Menu, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = React.useState<any>(null);

  // Hide navbar completely when in quiz mode
  const isQuizMode = location.pathname === '/daily-revision' && location.search.includes('mode=quiz');
  
  if (isQuizMode) {
    return null;
  }

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Chapters', path: '/chapters' },
    { name: 'Learning Plans', path: '/learning-plans' },
    { name: 'Daily Revision', path: '/daily-revision' },
    { name: 'Bookmarks', path: '/bookmarks' },
    { name: 'Progress', path: '/progress' },
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Book className="h-6 w-6 text-primary rounded-md" />
                <span className="font-bold text-lg text-gray-900">叶之寒雪</span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map(link => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            )}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>叶之寒雪</SheetTitle>
                    <SheetDescription>
                      Your Korean learning companion
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col space-y-3">
                    {navLinks.map(link => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50"
                      >
                        {link.name}
                      </Link>
                    ))}
                    {session ? (
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="flex items-center justify-start px-3 py-2"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate('/auth')}
                        variant="ghost"
                        className="flex items-center justify-start px-3 py-2"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
