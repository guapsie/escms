<?php

$atoms_dir = __DIR__ . '/src/atoms';

// Map of atom names to their ARIA roles and labels
$aria_map = [
    'Nav' => ['role' => 'navigation', 'aria-label' => 'Main Navigation'],
    'Header' => ['role' => 'banner'],
    'Footer' => ['role' => 'contentinfo'],
    'Main' => ['role' => 'main'],
    'Aside' => ['role' => 'complementary'],
    'Article' => ['role' => 'article'],
    'Section' => ['role' => 'region', 'aria-label' => 'Section'],
    'Container' => ['role' => 'region', 'aria-label' => 'Container'],
    'Grid' => ['role' => 'region', 'aria-label' => 'Grid'],
    'Columns' => ['role' => 'region', 'aria-label' => 'Columns'],
    'Separator' => ['role' => 'separator', 'aria-hidden' => 'true'],
    'Spacer' => ['role' => 'separator', 'aria-hidden' => 'true'],
    'Button' => ['role' => 'button', 'tabindex' => '0'],
    'Image' => ['alt' => ''],
    'Video' => ['aria-label' => 'Media player'],
    'YouTube' => ['aria-label' => 'Media player'],
    'Vimeo' => ['aria-label' => 'Media player'],
    'Audio' => ['aria-label' => 'Audio player']
];

$atoms = array_diff(scandir($atoms_dir), array('..', '.'));

foreach ($atoms as $atom) {
    $atom_path = $atoms_dir . '/' . $atom . '/atom.json';
    if (file_exists($atom_path)) {
        $json = file_get_contents($atom_path);
        $data = json_decode($json, true);
        
        if (isset($aria_map[$atom])) {
            if (!isset($data['attributes'])) {
                $data['attributes'] = [];
            }
            foreach ($aria_map[$atom] as $key => $value) {
                $data['attributes'][$key] = $value;
            }
            
            // Also, make sure ariaLabel is an allowed control if it has an aria-label
            if (!in_array('ariaLabel', $data['allowedControls'])) {
                $data['allowedControls'][] = 'ariaLabel';
            }
            
            // Re-encode JSON nicely
            $new_json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            file_put_contents($atom_path, $new_json);
            echo "Updated {$atom} with ARIA attributes.\n";
        } else {
            // For other atoms, just allow ariaLabel in controls so users can add it
            if (isset($data['allowedControls']) && !in_array('ariaLabel', $data['allowedControls'])) {
                $data['allowedControls'][] = 'ariaLabel';
                $new_json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                file_put_contents($atom_path, $new_json);
                echo "Updated {$atom} with ariaLabel control.\n";
            }
        }
    }
}

echo "Done.\n";
?>
