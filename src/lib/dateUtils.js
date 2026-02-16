// Helper functions for WIB timezone handling

/**
 * Get current date in WIB timezone (YYYY-MM-DD format)
 */
export function getTodayWIB() {
  const now = new Date()
  const wibOffset = 7 * 60 // WIB is UTC+7
  const wibTime = new Date(now.getTime() + (wibOffset * 60 * 1000))
  return wibTime.toISOString().split('T')[0]
}

/**
 * Get current working date (bisa berbeda dari tanggal real jika user sudah complete hari ini)
 */
export function getCurrentWorkingDate() {
  const today = getTodayWIB()
  const workingDate = localStorage.getItem('currentWorkingDate')
  
  // Jika working date tidak ada atau sudah lewat dari hari ini, reset ke hari ini
  if (!workingDate || workingDate < today) {
    localStorage.setItem('currentWorkingDate', today)
    return today
  }
  
  return workingDate
}

/**
 * Set working date ke hari berikutnya (dipanggil saat complete day)
 */
export function advanceWorkingDate() {
  const currentWorking = getCurrentWorkingDate()
  const date = new Date(currentWorking)
  date.setDate(date.getDate() + 1)
  const nextDate = date.toISOString().split('T')[0]
  localStorage.setItem('currentWorkingDate', nextDate)
  return nextDate
}

/**
 * Reset working date ke hari ini (untuk testing atau manual reset)
 */
export function resetWorkingDate() {
  const today = getTodayWIB()
  localStorage.setItem('currentWorkingDate', today)
  return today
}
