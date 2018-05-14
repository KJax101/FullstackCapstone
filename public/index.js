$(function() {
console.log('onload happening');

var slideIndex = 0;
carousel();

var counter = 0
function carousel() {
  let array = ["CarouselPictures/cheetah22.jpg", "CarouselPictures/astronaut.jpg", 
  "CarouselPictures/mountains.jpg", "CarouselPictures/tokyo.jpg", "CarouselPictures/cruise.jpg", "CarouselPictures/orchestra.jpg", 
  "CarouselPictures/pickers.jpg"]
  $(".imgholder").css("background-image",  "url(" + array[counter] + ")");
  counter++
  if (counter === array.length)
    counter = 0
  setTimeout(carousel, 3500);
}


  $(".aboutMPB").on("click", function() {
    window.scroll({
       top: 850, 
        left: 0, 
        behavior: 'smooth' 
    });
    });

  $(".nav-left").on("click", function() {
    window.scroll({
       top: 850, 
        left: 0, 
        behavior: 'smooth' 
    });
    });

  $(".nav-right").on("click", function() {
    window.scroll({
       top: 1620, 
        left: 0, 
        behavior: 'smooth' 
  }); 
  });

  $(".gosign").on("click", function() {
      window.scroll({
        top: 1620,
        left:0,
        behavior: 'smooth'
  });
  });
});
