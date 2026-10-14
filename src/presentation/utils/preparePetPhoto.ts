export async function preparePetPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Selecciona una imagen JPG, PNG o WebP.')
  if (file.size > 5 * 1024 * 1024)
    throw new Error('La fotografía debe pesar como máximo 5 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(
      1,
      480 / Math.max(image.naturalWidth, image.naturalHeight),
    )
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo procesar la imagen.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `No se pudo cargar la fotografía: ${error.message}`
        : 'No se pudo cargar la fotografía.',
      { cause: error },
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
