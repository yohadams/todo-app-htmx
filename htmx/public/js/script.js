document.addEventListener('DOMContentLoaded', function() {
  const maxLength = 500;
  const input = document.querySelector('input[type="text"]');
  const small = document.querySelector('small');

  input.setAttribute('maxlength', maxLength);
  small.innerText = `Max number of characters in todo is ${maxLength}.`;

  input.addEventListener('input', function() {
    if (this.value.length === this.maxLength) {
      small.style.opacity = 1;
      small.style.visibility = 'visible';
    } else {
      small.style.opacity = 0;
      small.style.visibility = 'hidden';
    }
  });
});