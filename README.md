# Next.js 14 Kanban Board App

A modern, real-time Kanban board application built with Next.js 14, featuring drag-and-drop functionality, optimistic UI updates, real-time collaboration, and comprehensive accessibility support.

![Kanban Board Demo](https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=600&fit=crop)

## 🚀 Features

### Core Functionality
- **Drag & Drop**: Smooth task movement between columns with visual feedback
- **Real-time Collaboration**: Live updates via Socket.IO when multiple users work simultaneously
- **Optimistic UI**: Immediate UI updates with rollback on API failures
- **Mobile Support**: Touch-friendly drag handles and responsive design

### Task Management
- **Rich Task Details**: Title, description, priority, tags, assignees, due dates
- **User Assignment**: Assign multiple users to tasks with avatar display
- **Priority Levels**: Visual priority indicators (low, medium, high, urgent)
- **Tagging System**: Organize tasks with custom tags
- **Search & Filter**: Find tasks by keyword, assignee, tag, or priority

### Technical Features
- **Performance**: Virtualized task lists for handling large datasets
- **Accessibility**: Full keyboard navigation, ARIA roles, focus management
- **Dark/Light Mode**: System-aware theme switching with persistence
- **Error Handling**: Toast notifications with undo functionality
- **Type Safety**: Full TypeScript coverage with strict typing

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - App Router, Server Components, API Routes
- **TypeScript** - Full type safety
- **Tailwind CSS** - Styling with shadcn/ui components
- **Framer Motion** - Smooth animations and transitions
- **Redux Toolkit** - Global state management
- **React Hook Form** - Form handling with Zod validation

### Backend & Database
- **MongoDB** - Document database with Mongoose ODM
- **Socket.IO** - Real-time communication
- **Next.js API Routes** - REST API endpoints

### Development & Testing
- **Jest** - Unit and integration testing
- **React Testing Library** - Component testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

### UI & UX
- **@hello-pangea/dnd** - Drag and drop functionality
- **React Window** - Virtualization for performance
- **React Hot Toast** - User notifications
- **Lucide React** - Icon library

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dragNdrop-app-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/kanban-board
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or update the URI to point to your MongoDB instance.

5. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

6. **Start the development servers**
   
   Terminal 1 - Next.js app:
   ```bash
   npm run dev
   ```
   
   Terminal 2 - Socket.IO server:
   ```bash
   npm run socket-server
   ```

7. **Open the application**
   Visit [http://localhost:3000](http://localhost:3000) to see the demo board.

## 🎯 Usage

### Basic Operations
- **View Tasks**: Browse tasks organized in columns (Backlog, Todo, In Progress, Review, Done)
- **Create Tasks**: Click the "+" button in any column to add new tasks
- **Edit Tasks**: Click on any task card to open the edit modal
- **Move Tasks**: Drag tasks between columns or reorder within columns
- **Delete Tasks**: Use the delete button in the task edit modal

### Advanced Features
- **Search**: Use the search bar to find tasks by title, description, or tags
- **Filter**: Click the filter button to filter by assignees, tags, or priority
- **Real-time Updates**: Changes are immediately visible to all connected users
- **Optimistic Updates**: UI updates instantly, with rollback on failures
- **Keyboard Navigation**: Use Tab, Enter, and arrow keys for accessibility

### User Management
- **Assign Users**: Add users to tasks via the task edit modal
- **User Avatars**: Visual representation of assigned users
- **Real-time Presence**: See who's currently online and working on the board

## 🧪 Testing

Run the full test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

The project maintains >80% code coverage across:
- Redux reducers and actions
- Utility functions
- React components
- Custom hooks
- API endpoints

## 🏗 Architecture

### State Management
```
src/store/
├── index.ts          # Store configuration
├── boardsSlice.ts    # Board state management
├── tasksSlice.ts     # Task state with optimistic updates
├── usersSlice.ts     # User management
└── uiSlice.ts        # UI state (modals, filters, theme)
```

### Custom Hooks
```
src/hooks/
├── useSocket.ts      # Socket.IO connection and events
├── useTasks.ts       # Task operations with optimistic updates
└── useBoards.ts      # Board operations
```

### Components Structure
```
src/components/
├── ui/               # Reusable UI components (shadcn/ui)
├── KanbanBoard.tsx   # Main board container
├── Column.tsx        # Column with drag-drop support
├── TaskCard.tsx      # Individual task cards
├── TaskModal.tsx     # Task creation/editing modal
├── SearchFilterBar.tsx # Search and filter controls
└── UserAvatar.tsx    # User avatar component
```

### API Routes
```
src/app/api/
├── boards/           # Board CRUD operations
├── tasks/            # Task CRUD and move operations
└── users/            # User management
```

## 🔧 Configuration

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `NEXT_PUBLIC_SOCKET_URL` - Socket.IO server URL
- `NODE_ENV` - Environment (development/production)

### Customization Options
- **Themes**: Modify `src/app/globals.css` for color schemes
- **Columns**: Adjust default columns in seed script
- **Priorities**: Update priority options in types and components
- **Virtualization**: Configure task list virtualization thresholds

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
1. Create `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Build and run:
   ```bash
   docker build -t kanban-board .
   docker run -p 3000:3000 kanban-board
   ```

### Environment Setup
- Set up MongoDB (Atlas or self-hosted)
- Deploy Socket.IO server separately or use serverless alternatives
- Configure environment variables for production

## 🎨 UI/UX Features

### Design System
- **Consistent Colors**: Semantic color tokens for different states
- **Typography**: Clear hierarchy with readable font sizes
- **Spacing**: Consistent padding and margins throughout
- **Animations**: Smooth transitions that enhance user experience

### Accessibility
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Management**: Clear focus indicators and logical tab order
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user's motion preferences

### Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Touch Friendly**: Large touch targets and gestures
- **Adaptive Layout**: Smooth transitions between screen sizes
- **Performance**: Optimized for various network conditions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js Team](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- [Hello Pangea DnD](https://github.com/hello-pangea/dnd) for drag-and-drop functionality
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

## 📞 Support

For support, email [your-email@example.com] or open an issue on GitHub.

---

**Made with ❤️ using Next.js 14, TypeScript, and modern web technologies**
