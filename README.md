# AllStars DAVV

A social networking platform built exclusively for students of Devi Ahilya Vishwavidyalaya (DAVV), Indore. The platform helps students discover talented peers, form teams for events and projects, and connect with people who share similar interests.

## Live Demo

https://allstars-davv.web.app

## What is AllStars DAVV?

Every college campus has students with amazing skills hidden in plain sight. Someone in your class might be a brilliant guitarist, the person in your hostel could be an ace footballer, and that quiet student in the library might be a chess champion. But we rarely get to know about them.

AllStars DAVV solves this problem. It is a platform where DAVV students can showcase their talents, find others with matching interests, and build connections that go beyond just academics. Whether you want to form a band, find teammates for a sports tournament, or collaborate on creative projects, AllStars helps you find your people.


## Key Features

- **Profile Setup:** Six-step onboarding wizard to set up your profile, including department, branch, year, hostel/day scholar status, interests, skills, and collaboration preferences.
- **Interest Based Discovery:** Discover students by interests and skills. Filter and search for collaborators in music, sports, dance, and more.
- **Personalised Feed:** See posts from people you follow and content relevant to your interests. Create posts to share updates, events, or find teammates.
- **Threaded Comments & Replies:** Posts support threaded comments and replies, with real-time updates and like support for both comments and replies.
- **Real-Time Notifications:** Get instant notifications for new followers, post likes, comments, replies, and likes on comments/replies. All notifications update in real time.
- **Groups & Group Chats:** Join or create public/private groups by interest. Each group has its own chat, member list, and discussion space. Group chats support real-time messaging and history.
- **Unified Messages Inbox:** Messages tab shows all your direct messages (DMs) and group chats in one place, with full conversation history and real-time updates.
- **Followers and Following:** Build your network by following others. View your followers/following lists and discover mutual connections.

## Tech Stack

The entire application runs on free tier services, making it accessible for student developers to learn from and contribute to.

| Component | Technology |
|-----------|------------|
| Frontend | React 18 with TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS with shadcn/ui components |
| Backend | Firebase (Authentication, Firestore Database, Storage) |
| State Management | TanStack Query (React Query) |
| Routing | React Router v6 |
| Form Handling | React Hook Form with Zod validation |
| Hosting | Firebase Hosting |

## Getting Started

### Prerequisites

You need Node.js 18 or above installed on your machine. Alternatively, you can use Bun as the JavaScript runtime.

You also need a Firebase project with Authentication, Firestore, and Storage enabled.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/satyasumiran/AllStars-DAVV.git
cd AllStars-DAVV
npm install
```

### Environment Setup

Create a `.env` file in the root directory with your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:8080

### Building for Production

```bash
npm run build
```

### Deploying to Firebase

```bash
firebase deploy
```


## Project Structure

```
src/
  components/
    cards/          PostCard, UserCard, GroupCard
    forms/          CreatePostForm
    layout/         Navbar, PageContainer, NotificationBell
    ui/             shadcn/ui components and custom UI elements
  contexts/         AuthContext for authentication state
  hooks/            Custom hooks like useProfile, useFollows
  integrations/
    firebase/       Firebase config, Firestore logic, types
  lib/              Constants and utility functions
  pages/            All route pages (Feed, Discover, Groups, Messages, etc.)
  test/             Test setup and example tests
```

## Interest Categories

The platform supports the following interest categories:

| Category | Examples |
|----------|----------|
| Sports | Basketball, Football, Cricket, Badminton, Volleyball, Tennis, Chess, Swimming, Boxing, MMA |
| Dance | Hip Hop, Contemporary, Classical, Freestyle, Breaking, Bollywood, Kathak, Salsa |
| Music | Indie, Pop, Classical, Hip Hop, Rock, Jazz, EDM, Ghazal, Folk, Rap |
| Creative | Photography, Filmmaking, Writing, Poetry, Content Creation, Graphic Design, UI/UX |
| Theatre | Acting, Scriptwriting, Direction, Street Play, Improvisation |
| Fitness | Gym, Yoga, Calisthenics, CrossFit, Zumba |
| Gaming | BGMI, Valorant, CS:GO, FIFA, Chess Online, Mobile Games |

## Contact

If you have questions or suggestions, feel free to reach out or open an issue on GitHub.

Built with ❤️ for DAVV students, by DAVV students.
