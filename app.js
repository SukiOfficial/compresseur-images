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
      // Fond blanc pour les PNG transparents convertis en JPEG (pas de canal alpha en JPEG)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // On réencode systématiquement en JPEG : c'est le format qui compresse
      // vraiment par qualité. Le PNG est sans perte, donc le "compresser"
      // ne réduit quasiment jamais son poids.
      const outputType = 'image/jpeg';

      canvas.toBlob((compressedBlob) => {
        // Garde-fou : si jamais le résultat est plus gros que l'original,
        // on renvoie l'original tel quel plutôt qu'un fichier "compressé" plus lourd.
        const finalBlob = compressedBlob.size < file.size ? compressedBlob : file;
        const wasKept = finalBlob === file;
        renderFileCard(file, finalBlob, e.target.result, outputType, wasKept);
      }, outputType, currentQuality);
    };
    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

function renderFileCard(originalFile, compressedBlob, thumbSrc, outputType, wasKept) {
  const card = document.createElement('div');
  card.className = 'file-card';

  const ext = wasKept ? (originalFile.name.split('.').pop() || 'jpg') : 'jpg';
  const newName = originalFile.name.replace(/\.[^/.]+$/, '') + (wasKept ? '' : '-compressed') + '.' + ext;
  const note = wasKept ? ' <span style="color:#999;">(déjà optimale à cette qualité)</span>' : '';

  card.innerHTML = `
    <img class="thumb" src="${thumbSrc}" alt="${originalFile.name}">
    <div class="file-meta">
      <div class="file-name">${originalFile.name}</div>
      <div class="size-line">${formatBytes(originalFile.size)} <span class="arrow">→</span> <span class="after">${formatBytes(compressedBlob.size)}</span>${note}</div>
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
