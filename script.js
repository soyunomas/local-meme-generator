document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM (sin cambios) ---
    const dropZone = document.getElementById('drop-zone'); /* ... */ const fileInput = document.getElementById('file-input'); /* ... */ const textInput = document.getElementById('text-input'); /* ... */ const positionRadios = document.querySelectorAll('input[name="textPosition"]'); /* ... */ const fontSelect = document.getElementById('font-select'); /* ... */ const fontSizeSlider = document.getElementById('font-size-slider'); /* ... */ const fontSizeValueSpan = document.getElementById('font-size-value'); /* ... */ const vOffsetSlider = document.getElementById('text-v-offset-slider'); /* ... */ const vOffsetValueSpan = document.getElementById('v-offset-value'); /* ... */ const styleRadios = document.querySelectorAll('input[name="textStyle"]'); /* ... */ const previewCanvas = document.getElementById('meme-canvas'); /* ... */ const previewCtx = previewCanvas.getContext('2d'); /* ... */ const downloadBtn = document.getElementById('download-btn'); /* ... */ const canvasPlaceholder = document.getElementById('canvas-placeholder'); /* ... */ const previewContainer = document.getElementById('meme-preview-container');

    // --- Estado de la Aplicación (sin cambios) ---
    let currentImage = null; let currentText = ''; let currentPosition = 'top'; let currentFont = fontSelect.value; let currentFontSize = parseInt(fontSizeSlider.value, 10); let currentVOffset = parseInt(vOffsetSlider.value, 10); let currentStyle = 'white-black'; let displayWidth = 0; let displayHeight = 0;

    // --- Funciones ---

    function calculateDisplayDimensions(naturalWidth, naturalHeight) { /* ... (sin cambios) ... */
        const containerStyle = window.getComputedStyle(previewContainer); const containerPaddingX = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight); const maxWidth = previewContainer.clientWidth - containerPaddingX; let dWidth = naturalWidth; let dHeight = naturalHeight; if (naturalWidth > maxWidth) { const aspectRatio = naturalWidth / naturalHeight; dWidth = maxWidth; dHeight = dWidth / aspectRatio; } dWidth = Math.max(1, Math.floor(dWidth)); dHeight = Math.max(1, Math.floor(dHeight)); return { width: dWidth, height: dHeight };
    }

    /**
     * Dibuja el meme en un contexto, aplicando un factor de escala a los elementos.
     * @param {CanvasRenderingContext2D} ctx Contexto destino.
     * @param {number} targetWidth Ancho del canvas destino.
     * @param {number} targetHeight Alto del canvas destino.
     * @param {HTMLImageElement} image Imagen a dibujar.
     * @param {string} text Texto del meme.
     * @param {string} position 'top' o 'bottom'.
     * @param {string} font Fuente CSS.
     * @param {number} baseFontSize Tamaño de fuente (como en el slider).
     * @param {number} baseVOffset Offset vertical (como en el slider).
     * @param {string} style Código de estilo.
     * @param {number} scaleFactor Factor para escalar elementos (1 para previsualización).
     */
    function renderMemeOnContext(ctx, targetWidth, targetHeight, image, text, position, font, baseFontSize, baseVOffset, style, scaleFactor = 1) {
        // 1. Dibujar imagen de fondo
        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

        // *** 2. Calcular valores ESCALADOS ***
        const scaledFontSize = baseFontSize * scaleFactor;
        const scaledVOffset = baseVOffset * scaleFactor;
        // Otros valores que dependen del tamaño de fuente también deben escalarse
        const scaledLineHeight = scaledFontSize * 1.2;
        const scaledVPadding = scaledFontSize * 0.3; // Padding relativo a la fuente escalada

        // 3. Configurar estilo de texto con fuente ESCALADA
        ctx.font = `bold ${scaledFontSize}px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 4. Definir Variables de Estilo (El cálculo de lineWidth ahora usa scaledFontSize)
        let fillColor = 'white'; let strokeColor = 'black'; let lineWidth = 0;
        let drawOutline = false; let drawBackgroundStripe = false;
        let stripeColor = 'black'; let isFullWidthStripe = false;
        switch (style) {
             case 'white-black': fillColor = 'white'; strokeColor = 'black'; lineWidth = Math.max(3 * scaleFactor, Math.floor(scaledFontSize / 10)); drawOutline = true; break; // Escalar lineWidth base y ratio
             case 'black-white': fillColor = 'black'; strokeColor = 'white'; lineWidth = Math.max(3 * scaleFactor, Math.floor(scaledFontSize / 10)); drawOutline = true; break; // Escalar lineWidth base y ratio
             case 'white-outline': fillColor = 'white'; strokeColor = 'black'; lineWidth = Math.max(1 * scaleFactor, Math.floor(scaledFontSize / 15)); drawOutline = true; break; // Escalar lineWidth base y ratio
             case 'white-black-bg': fillColor = 'white'; stripeColor = 'rgba(0, 0, 0, 0.75)'; drawBackgroundStripe = true; break; // Sin borde
             case 'black-white-bg': fillColor = 'black'; stripeColor = 'rgba(255, 255, 255, 0.75)'; drawBackgroundStripe = true; break; // Sin borde
             case 'white-full-black-bg': fillColor = 'white'; stripeColor = 'rgba(0, 0, 0, 0.85)'; drawBackgroundStripe = true; isFullWidthStripe = true; break; // Sin borde
             case 'black-full-white-bg': fillColor = 'black'; stripeColor = 'rgba(255, 255, 255, 0.85)'; drawBackgroundStripe = true; isFullWidthStripe = true; break; // Sin borde
        }

        // 5. Procesar y Dibujar Texto (usando valores escalados)
        if (text.trim() !== '') {
            const textToDraw = text.toUpperCase();
            const maxLineWidth = targetWidth * 0.95;
            const words = textToDraw.split(' '); let line = ''; const lines = [];
            ctx.font = `bold ${scaledFontSize}px ${font}`; // Reasegurar fuente ESCALADA
            for (let n = 0; n < words.length; n++) { /* ... (lógica de wrap sin cambios, usa ctx.measureText con fuente escalada) ... */
                 const testLine = line + words[n] + ' '; const metrics = ctx.measureText(testLine); const testWidth = metrics.width; if (testWidth > maxLineWidth && n > 0) { lines.push(line.trim()); line = words[n] + ' '; } else { line = testLine; }
            } lines.push(line.trim());

            // Calcular altura usando valores ESCALADOS
            const totalTextHeight = lines.length * scaledLineHeight;
            const baseStripeHeight = totalTextHeight + (isFullWidthStripe ? scaledVPadding * 1.5 : scaledVPadding);

            // Lógica de Posicionamiento Y (usando targetHeight, scaledVOffset, scaledLineHeight, scaledVPadding)
            let textDrawStartY; let stripeDrawY = 0; let stripeDrawHeight = baseStripeHeight;
            const textStartYRelativeToBlockTop = (isFullWidthStripe ? scaledVPadding * 0.75 : 0) + (scaledLineHeight / 2);

            if (isFullWidthStripe) {
                if (position === 'top') {
                    stripeDrawY = 0;
                    textDrawStartY = textStartYRelativeToBlockTop + scaledVOffset; // Usar offset escalado
                    stripeDrawHeight = Math.max(baseStripeHeight, textDrawStartY + totalTextHeight - (scaledLineHeight / 2) + (scaledVPadding * 0.75) );
                } else { // bottom
                    const textBlockBaseY = targetHeight - baseStripeHeight;
                    textDrawStartY = textBlockBaseY + textStartYRelativeToBlockTop + scaledVOffset; // Usar offset escalado
                    stripeDrawY = textDrawStartY - textStartYRelativeToBlockTop;
                    stripeDrawHeight = targetHeight - stripeDrawY;
                }
            } else { // Estilos SIN franja completa
                if (position === 'top') {
                    textDrawStartY = textStartYRelativeToBlockTop + scaledVOffset; // Usar offset escalado
                } else { // bottom
                    const textBlockBaseY = targetHeight - totalTextHeight;
                    textDrawStartY = textBlockBaseY + (scaledLineHeight / 2) + scaledVOffset; // Usar offset escalado
                }
            }

            // Dibujar Franja COMPLETA (si aplica)
            if (drawBackgroundStripe && isFullWidthStripe) {
                 ctx.fillStyle = stripeColor; stripeDrawHeight = Math.max(0, stripeDrawHeight); ctx.fillRect(0, stripeDrawY, targetWidth, stripeDrawHeight);
            }

            // Dibujar cada línea (usando valores escalados)
            lines.forEach((lineText, index) => {
                const currentLineY = textDrawStartY + index * scaledLineHeight; // Usar altura de línea escalada
                const textX = targetWidth / 2;
                const textMetrics = ctx.measureText(lineText); // Medida con fuente escalada
                const textWidth = textMetrics.width;

                // Dibujar Franja AJUSTADA (si aplica) - Usa padding/tamaño escalado
                if (drawBackgroundStripe && !isFullWidthStripe) {
                    const rectHeight = scaledLineHeight * 0.9; // Basado en altura escalada
                    const rectY = currentLineY - rectHeight / 2;
                    const rectX = textX - textWidth / 2 - scaledFontSize * 0.1; // Padding escalado
                    const rectWidth = textWidth + scaledFontSize * 0.2; // Padding escalado
                    ctx.fillStyle = stripeColor; ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
                }

                // Dibujar Texto (Borde y Relleno) - Usa lineWidth escalado
                ctx.fillStyle = fillColor;
                if (drawOutline) {
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = lineWidth; // Ya calculado con escalado
                    ctx.strokeText(lineText, textX, currentLineY);
                }
                 if (!isFullWidthStripe || !drawBackgroundStripe) {
                    ctx.fillText(lineText, textX, currentLineY);
                 }
            });

             // Redibujar texto si es franja completa (encima)
             if (drawBackgroundStripe && isFullWidthStripe) {
                 ctx.fillStyle = fillColor;
                 lines.forEach((lineText, index) => {
                     const currentLineY = textDrawStartY + index * scaledLineHeight; const textX = targetWidth / 2; ctx.fillText(lineText, textX, currentLineY);
                 });
             }
        } // Fin if (text.trim())
    } // Fin renderMemeOnContext

    /**
     * Dibuja el meme en el CANVAS DE PREVISUALIZACIÓN.
     */
    function drawMemePreview() {
        if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) { /* ... (limpieza sin cambios) ... */
             canvasPlaceholder.style.display = 'flex'; previewCanvas.style.display = 'none'; previewCanvas.width = 1; previewCanvas.height = 1; previewCanvas.style.width = 'auto'; previewCanvas.style.height = 'auto'; previewCtx.clearRect(0, 0, 1, 1); downloadBtn.disabled = true; return;
        }

        canvasPlaceholder.style.display = 'none'; previewCanvas.style.display = 'block'; previewCanvas.style.backgroundColor = 'transparent';
        const dpr = window.devicePixelRatio || 1;

        // Configuración del Canvas de PREVISUALIZACIÓN
        previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        previewCanvas.width = Math.floor(displayWidth * dpr); previewCanvas.height = Math.floor(displayHeight * dpr);
        previewCanvas.style.width = `${displayWidth}px`; previewCanvas.style.height = `${displayHeight}px`;

        // Llamar a renderMemeOnContext con factor de escala 1 para la previsualización
        renderMemeOnContext(
            previewCtx, displayWidth, displayHeight, currentImage, currentText,
            currentPosition, currentFont, currentFontSize, currentVOffset, currentStyle,
            1 // Factor de escala = 1 para previsualización
        );

        downloadBtn.disabled = currentText.trim() === '';
    } // Fin drawMemePreview

    function loadImage(file) { /* ... (sin cambios) ... */
        if (!file.type.startsWith('image/')) { alert('...'); return; } const reader = new FileReader(); reader.onload = (e) => { const img = new Image(); img.onload = () => { currentImage = img; const displayDims = calculateDisplayDimensions(img.naturalWidth, img.naturalHeight); displayWidth = displayDims.width; displayHeight = displayDims.height; currentVOffset = 0; vOffsetSlider.value = 0; vOffsetValueSpan.textContent = 0; const baseSize = Math.max(16, Math.floor(displayWidth / 18)); currentFontSize = Math.max(parseInt(fontSizeSlider.min, 10), Math.min(parseInt(fontSizeSlider.max, 10), baseSize)); fontSizeSlider.value = currentFontSize; fontSizeValueSpan.textContent = currentFontSize; drawMemePreview(); }; img.onerror = () => { alert('Error al cargar la imagen.'); currentImage = null; displayWidth = 0; displayHeight = 0; drawMemePreview(); }; img.src = e.target.result; }; reader.onerror = () => { alert('Error al leer el archivo.'); currentImage = null; displayWidth = 0; displayHeight = 0; drawMemePreview(); }; reader.readAsDataURL(file);
    }

    // --- Event Listeners (sin cambios, llaman a drawMemePreview) ---
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); }); /*...*/ dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); }); /*...*/ dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) loadImage(e.dataTransfer.files[0]); }); /*...*/ dropZone.addEventListener('click', () => fileInput.click()); /*...*/ fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) loadImage(e.target.files[0]); }); /*...*/ textInput.addEventListener('input', (e) => { currentText = e.target.value; drawMemePreview(); }); /*...*/ positionRadios.forEach(radio => radio.addEventListener('change', (e) => { if(e.target.checked) { currentPosition = e.target.value; drawMemePreview(); } })); /*...*/ fontSelect.addEventListener('change', (e) => { currentFont = e.target.value; drawMemePreview(); }); /*...*/ fontSizeSlider.addEventListener('input', (e) => { currentFontSize = parseInt(e.target.value, 10); fontSizeValueSpan.textContent = currentFontSize; drawMemePreview(); }); /*...*/ vOffsetSlider.addEventListener('input', (e) => { currentVOffset = parseInt(e.target.value, 10); vOffsetValueSpan.textContent = currentVOffset; drawMemePreview(); }); /*...*/ styleRadios.forEach(radio => radio.addEventListener('change', (e) => { if(e.target.checked) { currentStyle = e.target.value; drawMemePreview(); } }));

    // *** LISTENER DE DESCARGA MODIFICADO ***
    downloadBtn.addEventListener('click', () => {
        if (!currentImage || !currentImage.complete || currentImage.naturalWidth === 0) { alert("..."); return; }

        // 1. Crear Canvas Temporal y Contexto
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // 2. Establecer Dimensiones Originales
        const originalWidth = currentImage.naturalWidth;
        const originalHeight = currentImage.naturalHeight;
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;

        // *** 3. Calcular Factor de Escala ***
        // Compara el ancho original con el ancho de la previsualización
        // Asegurarse que displayWidth no sea 0 para evitar división por cero
        const scaleFactor = (displayWidth > 0) ? (originalWidth / displayWidth) : 1;

        // 4. Llamar a renderMemeOnContext con contexto temporal, dimensiones ORIGINALES y factor de escala
        renderMemeOnContext(
            tempCtx,
            originalWidth, // Ancho Original
            originalHeight, // Alto Original
            currentImage,
            currentText,
            currentPosition,
            currentFont,
            currentFontSize, // Pasar el tamaño BASE del slider
            currentVOffset, // Pasar el offset BASE del slider
            currentStyle,
            scaleFactor // Pasar el factor de escala calculado
        );

        // 5. Generar Data URL y Descargar
        const dataURL = tempCanvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        const filename = `meme_${Date.now()}.png`;
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });

    // Redimensionar Ventana (sin cambios, llama a drawMemePreview)
    let resizeTimeout; window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(() => { if (currentImage) { const displayDims = calculateDisplayDimensions(currentImage.naturalWidth, currentImage.naturalHeight); displayWidth = displayDims.width; displayHeight = displayDims.height; drawMemePreview(); } }, 250); });

    // --- Inicialización (sin cambios) ---
    previewCanvas.style.display = 'none'; canvasPlaceholder.style.display = 'flex'; downloadBtn.disabled = true; fontSizeValueSpan.textContent = currentFontSize; vOffsetValueSpan.textContent = currentVOffset;

}); // Fin de DOMContentLoaded