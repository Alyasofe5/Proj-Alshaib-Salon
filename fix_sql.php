<?php
$sql = file_get_contents('database/salon.sql');
if (strpos($sql, 'FOREIGN_KEY_CHECKS=0') === false) {
    file_put_contents('database/salon.sql', "SET FOREIGN_KEY_CHECKS=0;\n" . $sql . "\nSET FOREIGN_KEY_CHECKS=1;\n");
    echo "Fixed.\n";
} else {
    echo "Already fixed.\n";
}
