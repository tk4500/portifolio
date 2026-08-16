# Desktop Metaphor Portfolio

A dynamic, interactive portfolio website built with **Vue 3**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. This project mimics a classic desktop operating system environment, providing users with a unique and engaging way to explore projects, skills, and professional experience.

## 🌟 Features

*   **OS-like Window Management:** Draggable, resizable windows with edge snapping, maximize/minimize capabilities, and z-index focus tracking.
*   **Dynamic Taskbar & Start Menu:** Features a taskbar (configurable to bottom, top, left, or right) that groups active applications. The Start Menu serves as an app launcher.
*   **Fully Bilingual (i18n):** Complete English and Portuguese (PT-BR) support. UI strings and all JSON data content switch instantly.
*   **Data-Driven Programs:** 
    *   **About Me:** A tabbed interface displaying professional experience, academics, and certifications.
    *   **Tech Stack:** A visual representation of technical skills categorized by area (Frontend, Backend, Tools) with usage level indicators.
    *   **Archive Manager & Project Viewer:** A file-explorer style interface to browse projects, leading to detailed views with screenshots and live links.
    *   **Contact:** Dynamic social and contact links.
*   **System Settings:** Allows real-time customization of the OS theme (Light/Dark/System), desktop background gradients, and taskbar positioning.

## 🛠️ Tech Stack

*   **Framework:** [Vue 3](https://vuejs.org/) (Composition API & `<script setup>`)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **State Management:** [Pinia](https://pinia.vuejs.org/)
*   **Localization:** [Vue I18n](https://vue-i18n.intlify.dev/)
*   **Interactivity:** [@vueuse/core](https://vueuse.org/) (specifically `useDraggable`, `useWindowSize`)

## 📦 Project Structure

*   `src/components/desktop/`: Core OS components like the main Desktop, Icons, and AppIcon renderer.
*   `src/components/window/`: The `WindowWrapper` component that handles all dragging, resizing, and snapping logic.
*   `src/components/taskbar/`: Taskbar, Start Menu, and window grouping logic.
*   `src/components/programs/`: The actual "applications" that run inside the windows (Settings, AboutMe, Stack, etc.).
*   `src/stores/`: Pinia stores for global UI state (`useSystemStore`) and window management (`useWindowsStore`).
*   `src/assets/data/`: JSON files that power the content of the applications.
*   `src/locales/`: i18n translation dictionaries.

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd portifolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📝 Customization

To make this portfolio your own, you can update the JSON files located in `src/assets/data/`:
*   `about.json`: Your bio, work history, and education.
*   `contact.json`: Your social links and email.
*   `projects.json`: Your portfolio projects, descriptions, and links.
*   `stack.json`: Your technical skills and proficiency levels.

Place your assets (profile picture, PDF resume, screenshots, icons) in the `public/` directory so they can be referenced dynamically by the JSON files.