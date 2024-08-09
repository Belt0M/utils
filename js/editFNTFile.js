let fntData = null
let fileName = 'modified.fnt'

document
	.getElementById('fntFileInput')
	.addEventListener('change', handleFileUpload)
document
	.getElementById('downloadBtn')
	.addEventListener('click', handleFileAndClipboard)

function handleFileUpload(event) {
	const file = event.target.files[0]
	const reader = new FileReader()

	fileName = file.name

	reader.onload = function (e) {
		fntData = e.target.result.split('\n')
	}

	reader.readAsText(file)
}

function handleFileAndClipboard() {
	const param = document.getElementById('paramSelector').value
	let inputValue = document.getElementById('paramValue').value

	if (!param || inputValue === '') {
		alert('Please select a parameter and enter a value.')
		return
	}

	// Modify the FNT data
	fntData = fntData.map(line => {
		if (line.startsWith('char id=')) {
			const regex = new RegExp(`${param}=(-?\\d+)`)
			const match = line.match(regex)

			if (match) {
				const currentValue = parseInt(match[1])
				const newValue = currentValue + parseInt(inputValue)

				return line.replace(regex, `${param}=${newValue}`)
			}
		}
		return line
	})

	// Create Blob and URL for download
	const blob = new Blob([fntData.join('\n')], {type: 'text/plain'})
	const url = URL.createObjectURL(blob)

	// Create temporary link to trigger download
	const a = document.createElement('a')
	a.href = url
	a.download = fileName
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)

	// Copy content to clipboard
	blob.text().then(text => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				console.log('FNT content copied to clipboard')
			})
			.catch(err => {
				console.error('Failed to copy content to clipboard', err)
			})
	})

	// Clean up
	URL.revokeObjectURL(url)
}
