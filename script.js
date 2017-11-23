const fs = require('fs')
const rmdir = require('rimraf') // rm -rf
const Jimp = require('jimp')

let args = process.argv.slice(2)
let fileName = args[0]
let resultFolderPath = 'results/' + fileName.split('/').pop()

const IMAGE_WIDTH = 16
const IMAGE_HEIGHT = 16

const AGENT_NAME_INDEX = 3
const IMAGE_START_INDEX = 8
const IMAGE_END_INDEX = IMAGE_START_INDEX + (IMAGE_WIDTH * IMAGE_HEIGHT) - 1

if (!fileName || fileName.trim() === '') {
  throw new Error('Invalid file name')
}

if (!fs.existsSync(fileName)) {
  throw new Error('File not found')
}

if (fs.existsSync(resultFolderPath)) {
  rmdir.sync(resultFolderPath)
}

if (!fs.existsSync('results')) {
  fs.mkdirSync('results')
}

fs.mkdirSync(resultFolderPath)

let lines = fs.readFileSync(fileName).toString().split('\n')
let agentLineIndex = -1
let agentName = null
let agentImage = null
let imageX, imageY

lines.forEach(line => {
  line = line.trim()

  if (line === '.A.') {
    agentLineIndex = 0
    agentImage = new Jimp(IMAGE_WIDTH, IMAGE_HEIGHT)
  }

  if (agentLineIndex !== -1) {
    agentLineIndex++

    if (agentLineIndex === AGENT_NAME_INDEX) {
      // skip agents with no name
      if (line === '') {
        agentLineIndex = -1
        return
      }

      agentName = line
      imageX = 0
      imageY = 0

      console.log(`Extracting ${agentName}...`)
    }

    if (agentLineIndex >= IMAGE_START_INDEX) {
      let color = parseInt(line, 10)
      color = color & 0xffffff
      color = color.toString(16) + 'ff'

      if (color === 'ffffffff') color = 'ffffff00' // white -> transparent

      color = parseInt(color, 16)

      agentImage.setPixelColor(color, imageX, imageY)

      imageX++

      if (imageX === 16) {
        imageX = 0
        imageY++
      }
    }

    if (agentLineIndex === IMAGE_END_INDEX) {
      agentLineIndex = -1

      agentImage.write(`${resultFolderPath}/${agentName}.png`)

      console.log(`${agentName} finished.`)
    }
  }
})

console.log()
console.log(`Result available on ${__dirname}/${resultFolderPath}/`)