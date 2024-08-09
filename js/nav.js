const liArr = document.querySelectorAll('.top-nav li')
const utilsArr = document.querySelectorAll('.util')

liArr.forEach((li, index) => {
	li.addEventListener('click', function () {
		li.classList.add('active')
		utilsArr[index].classList.add('active')

		liArr.forEach((li2, index2) => {
			if (index !== index2) {
				li2.classList.remove('active')
				utilsArr[index2].classList.remove('active')
			}
		})
	})
})
