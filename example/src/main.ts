import { Sortable } from '@recruitler/sortable';

// Initialize sortable lists when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Simple List
  new Sortable(document.getElementById('example1') as HTMLElement, {
    animation: 150,
    ghostClass: 'bg-blue-100',
  });

  // Shared Lists
  new Sortable(document.getElementById('example2-left') as HTMLElement, {
    animation: 150,
    group: 'shared',
    ghostClass: 'bg-blue-100',
  });

  new Sortable(document.getElementById('example2-right') as HTMLElement, {
    animation: 150,
    group: 'shared',
    ghostClass: 'bg-blue-100',
  });

  // Grid demo
  new Sortable(document.getElementById('gridDemo') as HTMLElement, {
    animation: 150,
    ghostClass: 'bg-blue-100',
  });
});
