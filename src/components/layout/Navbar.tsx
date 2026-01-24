import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Book, Menu, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = React.useState<any>(null);

  // Hide navbar completely when in quiz mode
  const isQuizMode = location.pathname === "/daily-revision" && location.search.includes("mode=quiz");

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
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Chapters", path: "/chapters" },
    { name: "Sentences", path: "/sentences" },
    { name: "TOPIK Resources", path: "/topik-resources" },
    { name: "Learning Plans", path: "/learning-plans" },
    { name: "Daily Revision", path: "/daily-revision" },
    { name: "Study Tracker", path: "/study-tracker" },
    { name: "Bookmarks", path: "/bookmarks" },
    { name: "Progress", path: "/progress" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-area-inset">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 touch-target">
                <Book className="h-5 w-5 sm:h-6 sm:w-6 text-primary rounded-md" />
                <span className="font-bold text-base sm:text-lg text-gray-900">叶帅学韩</span>
              </Link>
            </div>
            <nav className="hidden lg:ml-6 lg:flex lg:space-x-6">
              {navLinks.map((link) => (
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
          <div className="flex items-center space-x-2 sm:space-x-4">
            {session ? (
              <Button onClick={handleLogout} variant="ghost" className="hidden sm:flex items-center space-x-2 touch-target">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="ghost" className="hidden sm:flex items-center space-x-2 touch-target">
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            )}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="touch-target h-10 w-10 sm:h-9 sm:w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[85vw] max-w-[320px] mobile-scroll">
                  <SheetHeader>
                    <SheetTitle>叶之寒雪</SheetTitle>
                    <SheetDescription>Your Korean learning companion</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 active:bg-gray-100 touch-target"
                      >
                        {link.name}
                      </Link>
                    ))}
                    <div className="pt-4 border-t mt-4">
                      {session ? (
                        <Button
                          onClick={handleLogout}
                          variant="ghost"
                          className="flex items-center justify-start w-full px-3 py-3 touch-target"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      ) : (
                        <Button
                          onClick={() => navigate("/auth")}
                          variant="ghost"
                          className="flex items-center justify-start w-full px-3 py-3 touch-target"
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      )}
                    </div>
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
