let translations = {}
let englishTranslations = {}

// Читання англійського .str-файлу та збереження його в об'єкті englishTranslations
document
	.getElementById('englishFileInput')
	.addEventListener('change', function (event) {
		const file = event.target.files[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = function (e) {
				englishTranslations = JSON.parse(e.target.result).keys
				document.getElementById('output').innerText =
					'English STR file loaded successfully!'
			}
			reader.readAsText(file)
		}
	})

// Читання CSV-файлу та збереження його в об'єкті translations
document
	.getElementById('csvFileInput')
	.addEventListener('change', function (event) {
		const file = event.target.files[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = function (e) {
				const text = e.target.result
				const lines = text.split('\r\n')
				const headers = lines[0].split(',')

				for (let i = 1; i < headers.length; i++) {
					translations[headers[i]] = {}
				}

				for (let i = 1; i < lines.length; i++) {
					if (lines[i].trim() === '') continue

					const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)

					const key = row[0]

					for (let j = 1; j < headers.length; j++) {
						translations[headers[j]][key] = row[j]
							.replace(/(^"|"$)/g, '')
							.replace(/\\n/g, '\n')
					}
				}
				document.getElementById('output').innerText =
					'CSV file loaded successfully!'
			}
			reader.readAsText(file)
		}
	})

// Генерація STR-файлів та архівування
async function generateAndDownloadZip() {
	if (Object.keys(englishTranslations).length === 0) {
		alert('Please upload the English STR file first.')
		return
	}

	const zip = new JSZip()

	for (const lang in translations) {
		if (lang === 'EN') continue

		const strContent = {
			meta: {
				includes: [],
			},
			keys: {},
		}

		for (const key in englishTranslations) {
			// Якщо переклад відсутній в іншій мові, використовуємо англійський варіант
			strContent.keys[key] = translations[lang][key] || englishTranslations[key]
		}

		const jsonStr = JSON.stringify(strContent, null, 4)

		// Додаємо файл base.str в папку для відповідної мови
		zip.folder(lang).file('base.str', jsonStr)
	}

	// Генеруємо ZIP файл
	const content = await zip.generateAsync({type: 'blob'})

	// Завантаження архіву
	const link = document.createElement('a')
	link.href = URL.createObjectURL(content)
	link.download = `translations.zip`
	link.click()

	document.getElementById('output').innerText =
		'ZIP archive generated successfully!'
}
