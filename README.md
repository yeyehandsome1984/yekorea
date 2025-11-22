
# Welcome to your SSC Vocab project

## Project info

**URL**: https://lovable.dev/projects/f94ff01a-f75f-463f-947c-2ec64f60d716

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f94ff01a-f75f-463f-947c-2ec64f60d716) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f94ff01a-f75f-463f-947c-2ec64f60d716) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

```

Finally, update the Navbar to change the logo text:
<lov-write file_path="src/components/layout/Navbar.tsx">
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
const Navbar = () => {
  const navLinks = [{
    name: 'Home',
    path: '/'
  }, {
    name: 'Chapters',
    path: '/chapters'
  }, {
    name: 'Learning Plans',
    path: '/learning-plans'
  }, {
    name: 'Daily Revision',
    path: '/daily-revision'
  }, {
    name: 'Bookmarks',
    path: '/bookmarks'
  }, {
    name: 'Progress',
    path: '/progress'
  }];
  return <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Book className="h-6 w-6 text-primary rounded-md" />
                <span className="font-bold text-lg text-gray-900">SSC Vocab</span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map(link => <Link key={link.name} to={link.path} className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-primary border-b-2 border-transparent hover:border-primary">
                  {link.name}
                </Link>)}
            </nav>
          </div>
          <div className="sm:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>SSC Vocab</SheetTitle>
                  <SheetDescription>
                    Your personalized vocabulary learning companion
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 flex flex-col space-y-3">
                  {navLinks.map(link => <Link key={link.name} to={link.path} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
                      {link.name}
                    </Link>)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>;
};
export default Navbar;

