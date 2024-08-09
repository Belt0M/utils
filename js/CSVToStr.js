let translations = {}
let englishTranslations = {}
let baseLconf = {}

document
	.getElementById('englishFileInput')
	.addEventListener('change', function (event) {
		const label = document.querySelector('label[for="englishFileInput"]')
		const file = event.target.files[0]

		if (file && label) {
			label.innerText = file.name

			const reader = new FileReader()

			reader.onload = function (e) {
				englishTranslations = JSON.parse(e.target.result).keys
			}
			reader.readAsText(file)
		}
	})

document
	.getElementById('csvFileInput')
	.addEventListener('change', function (event) {
		const label = document.querySelector('label[for="csvFileInput"]')
		const file = event.target.files[0]

		if (file) {
			label.innerText = file.name

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
			}

			reader.readAsText(file)
		}
	})

document
	.getElementById('lconfFileInput')
	.addEventListener('change', function (event) {
		const label = document.querySelector('label[for="lconfFileInput"]')
		const file = event.target.files[0]

		if (file) {
			label.innerText = file.name

			const reader = new FileReader()

			reader.onload = function (e) {
				baseLconf = JSON.parse(e.target.result)
			}
			reader.readAsText(file)
		}
	})

function getUniqueCharacters(text) {
	const uniqueChars = new Set()

	for (let char of text) {
		if (char !== '\n') {
			uniqueChars.add(char)
		}
	}

	return [...uniqueChars].join('')
}

function formatCharacters(charString) {
	const lowerCase = []
	const upperCase = []
	const nonLatin = []
	const digits = []

	for (let char of charString) {
		if (char >= 'a' && char <= 'z') {
			lowerCase.push(char)
		} else if (char >= 'A' && char <= 'Z') {
			upperCase.push(char)
		} else if (char >= '0' && char <= '9') {
			digits.push(char)
		} else if (/[^a-zA-Z0-9]/.test(char)) {
			nonLatin.push(char)
		}
	}

	return lowerCase
		.sort()
		.concat(upperCase.sort(), nonLatin.sort(), ' ', digits.sort())
		.join('')
		.replace(/\s+/g, ' ')
}

function mergeUniqueCharacters(existingText, newText) {
	const existingSet = new Set(existingText)

	for (let char of newText) {
		if (char !== '\n') {
			existingSet.add(char)
		}
	}

	return [...existingSet].join('')
}

async function generateAndDownloadZip() {
	if (Object.keys(englishTranslations).length === 0) {
		alert('Please upload the English STR file first.')
		return
	}

	if (Object.keys(baseLconf).length === 0) {
		alert('Please upload the base LCONF file first.')
		return
	}

	const generateUsedLetters = document.getElementById(
		'generate-used-letters'
	).checked
	const localeZip = new JSZip()
	const stringsFolder = localeZip.folder('strings')
	const labelsFolder = localeZip.folder('labels')
	const fontLetters = {}

	for (const lang in translations) {
		if (lang === 'EN') continue

		const lowerCaseLang = lang.toLowerCase()

		const strContent = {
			meta: {
				includes: [],
			},
			keys: {},
		}

		for (const key in englishTranslations) {
			strContent.keys[key] = translations[lang][key] || englishTranslations[key]
		}

		const jsonStr = JSON.stringify(strContent, null, 4)
		const strLangFolder = stringsFolder.folder(lowerCaseLang)

		strLangFolder.file('base.str', jsonStr)
		strLangFolder.file(
			'rules.str',
			JSON.stringify({'01_t': 'Game Rules'}, null, 4)
		)
		strLangFolder.file(
			'ui_base.str',
			JSON.stringify(
				{
					meta: {
						includes: [],
					},
					keys: {
						BS_UI_: '',
					},
				},
				null,
				4
			)
		)

		strLangFolder.file(
			'ui_bg.str',
			JSON.stringify(
				{
					meta: {
						includes: [],
					},
					keys: {},
				},
				null,
				4
			)
		)

		const lconfContent = {}

		for (const key in baseLconf) {
			const item = {...baseLconf[key]}

			if (item.font_id) {
				const baseFontName = item.font_id
					.replace(/^FONTS_EN_/, '')
					.replace(/_FNT$|_FONT$/, '')
					.toLowerCase()
				const localizedFontName = `FONTS_${lang}_${baseFontName.toUpperCase()}_FNT`
				item.font_id = localizedFontName

				if (!fontLetters[baseFontName]) {
					fontLetters[baseFontName] = {}
				}

				if (strContent.keys[item.string_id]) {
					const usedChars = getUniqueCharacters(strContent.keys[item.string_id])

					if (!fontLetters[baseFontName][lowerCaseLang]) {
						fontLetters[baseFontName][lowerCaseLang] = usedChars
					} else {
						fontLetters[baseFontName][lowerCaseLang] = mergeUniqueCharacters(
							fontLetters[baseFontName][lowerCaseLang],
							usedChars
						)
					}
				}
			}

			lconfContent[key] = item
		}

		const lconfLangFolder = labelsFolder.folder(lowerCaseLang)

		lconfLangFolder.file('base.lconf', JSON.stringify(lconfContent, null, 4))
		lconfLangFolder.file('ui_base.lconf', '{}')
		lconfLangFolder.file('ui_bg.lconf', '{}')
	}

	const strLangFolderEn = stringsFolder.folder('en')
	const lconfLangFolderEn = labelsFolder.folder('en')

	const strContentEn = {
		meta: {
			includes: [],
		},
		keys: englishTranslations,
	}

	strLangFolderEn.file('base.str', JSON.stringify(strContentEn, null, 4))
	strLangFolderEn.file(
		'rules.str',
		JSON.stringify({'01_t': 'Game Rules'}, null, 4)
	)
	strLangFolderEn.file(
		'ui_base.str',
		JSON.stringify(
			{
				meta: {
					includes: [],
				},
				keys: {
					BS_UI_: '',
				},
			},
			null,
			4
		)
	)

	strLangFolderEn.file(
		'ui_bg.str',
		JSON.stringify(
			{
				meta: {
					includes: [],
				},
				keys: {},
			},
			null,
			4
		)
	)

	const lconfContentEn = {}

	for (const key in baseLconf) {
		lconfContentEn[key] = baseLconf[key]

		if (lconfContentEn[key].font_id) {
			const baseFontName = lconfContentEn[key].font_id
				.replace(/^FONTS_EN_/, '')
				.replace(/_FNT$|_FONT$/, '')
				.toLowerCase()

			lconfContentEn[key].font_id = `FONTS_EN_${baseFontName.toUpperCase()}`

			if (!fontLetters[baseFontName]) {
				fontLetters[baseFontName] = {}
			}

			const usedChars = getUniqueCharacters(
				strContentEn.keys[lconfContentEn[key].string_id]
			)

			if (!fontLetters[baseFontName]['en']) {
				fontLetters[baseFontName]['en'] = usedChars
			} else {
				fontLetters[baseFontName]['en'] = mergeUniqueCharacters(
					fontLetters[baseFontName]['en'],
					usedChars
				)
			}
		}
	}

	lconfLangFolderEn.file('base.lconf', JSON.stringify(lconfContentEn, null, 4))
	lconfLangFolderEn.file('ui_base.lconf', '{}')
	lconfLangFolderEn.file('ui_bg.lconf', '{}')

	const localeContent = await localeZip.generateAsync({type: 'blob'})
	const localeLink = document.createElement('a')

	localeLink.href = URL.createObjectURL(localeContent)
	localeLink.download = `locale.zip`
	localeLink.click()

	if (generateUsedLetters) {
		const lettersZip = new JSZip()

		for (const font in fontLetters) {
			const fontFolder = lettersZip.folder(font)

			for (const lang in fontLetters[font]) {
				const formattedLetters = formatCharacters(fontLetters[font][lang])
				fontFolder.file(`${lang}.txt`, formattedLetters)
			}
		}

		const lettersContent = await lettersZip.generateAsync({type: 'blob'})
		const lettersLink = document.createElement('a')

		lettersLink.href = URL.createObjectURL(lettersContent)
		lettersLink.download = `used_letters.zip`
		lettersLink.click()
	}
}
