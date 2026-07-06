const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');

let currentQuality = 0.7;

qualitySlider.addEventListener('input', () => {
  currentQuality = qualitySlider.value / 100;
  qualityValue.textContent = qualitySlider.value + '%';
});

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  [...files].forEach(file => {
    if (!file.type.match(/image\/(jpeg|png|webp)/)) return;
    compressImage(file);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
}

function compressImage(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      canvas.toBlob((blob) => {
        renderFileCard(file, blob, e.target.result, outputType);
      }, outputType, currentQuality);
    };
    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

function renderFileCard(originalFile, compressedBlob, thumbSrc, outputType) {
  const card = document.createElement('div');
  card.className = 'file-card';

  const ext = outputType === 'image/png' ? 'png' : 'jpg';
  const newName = originalFile.name.replace(/\.[^/.]+$/, '') + '-compressed.' + ext;

  card.innerHTML = `
    <img class="thumb" src="${thumbSrc}" alt="${originalFile.name}">
    <div class="file-meta">
      <div class="file-name">${originalFile.name}</div>
      <div class="size-line">${formatBytes(originalFile.size)} <span class="arrow">→</span> <span class="after">${formatBytes(compressedBlob.size)}</span></div>
    </div>
    <button class="dl-btn">Télécharger</button>
  `;

  const btn = card.querySelector('.dl-btn');
  btn.addEventListener('click', () => {
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = newName;
    a.click();
    URL.revokeObjectURL(url);
  });

  fileList.prepend(card);
}
