$(document).ready(function() {
    $("#reset-button").on("click", function() {
        $.post("/admin/reset", function(data, status) {
            alert(status);
        });
    });
});