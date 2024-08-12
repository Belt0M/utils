const downloadFNTBtn = document.getElementById('downloadFNTBtn')
const fntCheckbox = document.getElementById('generate-fnt-file')
let fntData = null
let fileName = 'modified.fnt'

document
	.getElementById('fntFileInput')
	.addEventListener('change', handleFileUpload)

fntCheckbox.addEventListener('change', function () {
	if (downloadFNTBtn) {
		downloadFNTBtn.innerText = this.checked
			? 'Download and Copy To Clipboard Modified FNT'
			: 'Copy To Clipboard Modified FNT'
	}
})
document
	.getElementById('downloadFNTBtn')
	.addEventListener('click', handleFileAndClipboard)

function handleFileUpload(event) {
	const file = event.target.files[0]
	const reader = new FileReader()

	const label = document.querySelector('label[for="fntFileInput"]')

	fileName = file.name

	label.innerText = fileName

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

	const isGenerateFNTArchive =
		document.getElementById('generate-fnt-file').checked

	const blob = new Blob([fntData.join('\n')], {type: 'text/plain'})

	if (isGenerateFNTArchive) {
		const url = URL.createObjectURL(blob)

		const a = document.createElement('a')
		a.href = url
		a.download = fileName
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}

	blob.text().then(text => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				downloadFNTBtn.setAttribute('disabled', true)

				downloadFNTBtn.innerText = 'Copied'

				setTimeout(() => {
					downloadFNTBtn.removeAttribute('disabled')

					downloadFNTBtn.innerText = fntCheckbox.checked
						? 'Download and Copy To Clipboard Modified FNT'
						: 'Copy To Clipboard Modified FNT'
				}, 2000)
			})
			.catch(err => {
				downloadFNTBtn.removeAttribute('disabled')

				downloadFNTBtn.innerText = 'Copied'

				setTimeout(() => {
					downloadFNTBtn.setAttribute('disabled', false)

					downloadFNTBtn.innerText = fntCheckbox.checked
						? 'Download and Copy To Clipboard Modified FNT'
						: 'Copy To Clipboard Modified FNT'
				}, 2000)
			})
	})

	if (isGenerateFNTArchive) {
		URL.revokeObjectURL(url)
	}
}
