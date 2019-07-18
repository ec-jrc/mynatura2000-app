angular.module('nat2000.filters', [])



.filter('filterOnlineReps', function() {

  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(input, type, status) {

          
    var output=[];
    /* filtering for type and picturetype */  
    angular.forEach(input, function(value, key) {
        
        /* in the end if this variable is not zero I'll add this to results */
        var add=0;
        
        if (type == 0 ) {
            add++;
        }    
        
        /* feedback */
        if (type==1 && value.type==0 ) {
            add++;
        }
        
        /* report */
        if (type==2 && value.type==1 ) {
            add++;
        }
        
        /* landscape */
        if (type==3 && value.type==1 && value.properties.Type==1 ) {
            add++;
        }
        
        /* species */
        if (type==4 && value.type==1 && value.properties.Type==2 ) {
            add++;
        }
        
        /* threats */
        if (type==5 && value.type==1 && value.properties.Type==3 ) {
            add++;
        }
        
        
        if (add>0) {
            
            /* check by status. Should be reviewed */
            var add2=0;
            
            if (status == 0 ) {
                add2++;
            }
            
            if (status == 1 && value.properties.Status== 'approved' ) {
                add2++;
            }
            
            if (status == 2 && value.properties.Status != 'approved' ) {
                add2++;
            }
            
            if (add2>0) {
                output.push(value);
            }    
            
        }
        
        
    });
    return output;

  }

})


.filter('filterDrafts', function() {

  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(input, type, status) {

          
    var output=[];
    /* filtering for type and picturetype */  
    angular.forEach(input, function(value, key) {
        
        /* in the end if this variable is not zero I'll add this to results */
        var add=0;
        
        /* if you have a text and the text don't match */
        if (type == 0 ) {
            add++;
        }    
        
        /* feedback */
        if (type==1 && value.type==1 ) {
            add++;
        }
        
        /* report */
        if (type==2 && value.type==0 ) {
            add++;
        }
        
        /* landscape */
        if (type==3 && value.type==0 && value.picturetype==1 ) {
            add++;
        }
        
        /* species */
        if (type==4 && value.type==0 && value.picturetype==2 ) {
            add++;
        }
        
        /* threats */
        if (type==5 && value.type==0 && value.picturetype==3 ) {
            add++;
        }        
        
        if (add>0) {
                output.push(value);
        }  
        
    });
    return output;

  }

})

.filter('filterSites', function() {

  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(input, text, country) {

    if(!text) {
        text='';
    }  
    if(text.length<3 && !country) {
        /* Not filtering if no filters are set. Text should be at least 3 letters */
        var output=input;
        
    }  else {
        
        var output=[];
      
        angular.forEach(input, function(value, key) {

            /* in the end if this variable is still zero I'll add this to results */
            var del=0;

            /* if you have a text and the text don't match */
            if (text.length>=3  && value.SITENAME.toLowerCase().indexOf( text.toLowerCase() ) < 0 ) {
                if (text.length>=3  && value.SITECODE.toLowerCase().indexOf( text.toLowerCase() ) < 0 ) {
                	del++;
                }
            }    

            /* if you selected a country and it's different */
            if (country && country!=value.CTRY_CODE ) {
                del++;
            }

            if (del==0) {
                output.push(value);
            }


        });
        
    }      
      
    return output;

  }

});