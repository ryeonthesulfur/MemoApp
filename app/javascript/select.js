document.addEventListener('turbo:load', function () {
  const select_btn = document.getElementById('select_btn');
  window.action_bar = document.querySelector('#action_bar');
  window.isSelecting = false;

  window.turnOffSelectMode = function () {
    window.isSelecting = false;
    window.icon_container.querySelectorAll('.folder-icon').forEach(icon => {
      icon.classList.remove('selecting');
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox) checkbox.remove();
    });
    window.action_bar.classList.remove('show');
  };

  select_btn.addEventListener('click', function () {
    window.isSelecting = !window.isSelecting;
    window.action_bar.classList.toggle('show');
    const icons = window.icon_container.querySelectorAll('.folder-icon');

    if (window.isSelecting) {
      icons.forEach(icon => {
        icon.classList.add('selecting');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('select-checkbox');
        icon.appendChild(checkbox);
      });
    } else {
      window.turnOffSelectMode();
    }
  });

  const delete_btn = document.getElementById('delete_btn');
  delete_btn.addEventListener('click', function () {
    const icons = window.icon_container.querySelectorAll('.folder-icon');
    icons.forEach(icon => {
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox && checkbox.checked) icon.remove();
    });
    window.turnOffSelectMode();
  });

  const copy_btn = document.getElementById('copy_btn');
  copy_btn.addEventListener('click', function () {
    const icons = window.icon_container.querySelectorAll('.folder-icon');
    icons.forEach(icon => {
      const checkbox = icon.querySelector('.select-checkbox');
      if (checkbox && checkbox.checked) {
        const clone = icon.cloneNode(true);
        const cloneCheckbox = clone.querySelector('.select-checkbox');
        if (cloneCheckbox) cloneCheckbox.remove();
        clone.classList.remove('selecting');

        const nameSpan = clone.querySelector('.folder-name');
        const baseName = nameSpan.textContent.replace(/_copy\(\d+\)$/, '');
        const existing = window.icon_container.querySelectorAll('.folder-name');
        let copyCount = 0;
        existing.forEach(span => {
          if (span.textContent.startsWith(baseName + '_copy(')) copyCount++;
        });
        nameSpan.textContent = `${baseName}_copy(${copyCount + 1})`;
        window.icon_container.appendChild(clone);
      }
    });
    window.turnOffSelectMode();
  });
});