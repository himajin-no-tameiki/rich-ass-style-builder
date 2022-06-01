import fs from 'fs'

export const debounce = function (wait, func) {
  let timeout
  return function (...args) {
    const context = this
    const later = () => {
      timeout = null
      func.apply(context, args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const randomColor = () => {
  const randomNum = Math.floor(Math.random() * 256 ** 3)
  const randomColor = '#' + randomNum.toString(16).padStart(6, '0').toUpperCase()
  return randomColor
}

export const createReadStreamSafe = (filename, options) => {
  return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filename, options)
      fileStream.on('error', reject).on('open', () => {
          resolve(fileStream)
      })
  })
}

export const createWriteStreamSafe = (filename, options) => {
  return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(filename, options)
      fileStream.on('error', reject).on('open', () => {
          resolve(fileStream)
      })
  })
}
