$(document).ready(function() {
  
  let posting = $.ajax({
    url: `${window.location.origin}/user/me`,

    type: 'POST',
    data: data,
     success: function(msg){
        console.log('res',msg);
        alertify.success('Success!');
        location.reload() 
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
         alertify.error('Cannot add category!');
      }
  }); 
})