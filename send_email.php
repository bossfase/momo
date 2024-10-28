<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars(strip_tags(trim($_POST['name'])));
    $email = htmlspecialchars(strip_tags(trim($_POST['email'])));
    $message = htmlspecialchars(strip_tags(trim($_POST['message'])));
    
    $to = "momo.bossfade@gmail.com"; // Deine E-Mail-Adresse
    $subject = "Neue Nachricht von Kontaktformular";
    $body = "Name: $name\nE-Mail: $email\n\nNachricht:\n$message";
    $headers = "From: $email\r\n" .
               "Reply-To: $email\r\n" .
               "X-Mailer: PHP/" . phpversion();

    if (mail($to, $subject, $body, $headers)) {
        echo "Nachricht erfolgreich gesendet.";
    } else {
        echo "Es gab ein Problem beim Senden der Nachricht.";
    }
} else {
    echo "Ungültige Anfrage.";
}
?>
