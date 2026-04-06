# Algorithm Animations Project

Step-by-step visualizations of classic algorithms using MVC architecture.

## How to Run

1. Open `navigation.html` in your browser
2. Click on any algorithm to view its animation
3. Use the back button to return to navigation

## File Structure
```
project/
├── navigation.html              # Main navigation page (start here)
├── GSindex.html                 # Gale-Shapley algorithm page
├── HungarianIndex.html          # Hungarian algorithm (coming soon)
├── DinicsIndex.html             # Dinic's algorithm (coming soon)
└── src/
    ├── algorithms/             # Pure algorithm logic (no UI)
    ├── models/                 # State management
    ├── views/                  # UI rendering
    ├── controllers/            # Coordinates model and view
    ├── utils/                  # Shared graphics library
    └── styles/                 # Shared CSS
```

## Algorithms
-  **Hungarian algorithm** - Assignment problem solver (minimum-cost matching in bipartite graphs)
-  **Gale-Shapley** - Stable matching algorithm (proposer-optimal interactive visualization)
-  **Dinic's algorithm** - Maximum flow algorithm using layered networks (visualization of flow and blocking flows)


## MVC Architecture

Each algorithm follows the same pattern:

- **Algorithm** (`src/algorithms/`) - Pure logic, testable independently
- **Model** (`src/models/`) - Manages state, notifies observers
- **View** (`src/views/`) - Renders UI, uses shared renderer
- **Controller** (`src/controllers/`) - Handles user input

## Shared Components

- `src/utils/AnimationRenderer.js` - Reusable graphics library for all algorithms
- `src/styles/animations.css` - Common styling for all algorithms

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation or build tools needed
- Works offline

---

**To start:** Just open `navigation.html`