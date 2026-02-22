-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `cognome` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NULL,
    `pin` VARCHAR(255) NOT NULL,
    `ruolo` VARCHAR(50) NOT NULL,
    `reparti` JSON NULL,
    `attivo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordini` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_conferma` VARCHAR(20) NOT NULL,
    `cliente` VARCHAR(255) NOT NULL,
    `riferimento` VARCHAR(255) NULL,
    `data_ordine` DATE NOT NULL,
    `quantita_porte` INTEGER NOT NULL DEFAULT 1,
    `tipo_telaio` VARCHAR(50) NOT NULL,
    `colore_telaio_interno` VARCHAR(50) NULL,
    `colore_telaio_esterno` VARCHAR(50) NULL,
    `verniciatura_necessaria` BOOLEAN NOT NULL DEFAULT false,
    `data_invio_verniciatura` DATETIME(3) NULL,
    `data_rientro_verniciatura` DATETIME(3) NULL,
    `urgente` BOOLEAN NOT NULL DEFAULT false,
    `data_tassativa` DATE NULL,
    `pdf_path` TEXT NULL,
    `stato` VARCHAR(50) NOT NULL DEFAULT 'in_produzione',
    `note_generali` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ordini_numero_conferma_key`(`numero_conferma`),
    INDEX `ordini_stato_idx`(`stato`),
    INDEX `ordini_urgente_idx`(`urgente`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materiali` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordine_id` INTEGER NOT NULL,
    `tipo_materiale` VARCHAR(50) NOT NULL,
    `sottotipo` VARCHAR(50) NULL,
    `necessario` BOOLEAN NOT NULL DEFAULT false,
    `note` TEXT NULL,
    `misure` VARCHAR(100) NULL,
    `data_ordine_effettivo` DATE NULL,
    `data_consegna_prevista` DATE NULL,
    `data_arrivo_effettivo` DATE NULL,
    `ordine_effettuato` BOOLEAN NOT NULL DEFAULT false,
    `arrivato` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `materiali_ordine_id_idx`(`ordine_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fasi_produzione` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordine_id` INTEGER NOT NULL,
    `nome_fase` VARCHAR(100) NOT NULL,
    `stato` VARCHAR(20) NOT NULL DEFAULT 'da_fare',
    `completata_da` INTEGER NULL,
    `data_completamento` DATETIME(3) NULL,
    `note` TEXT NULL,
    `foto_paths` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fasi_produzione_ordine_id_idx`(`ordine_id`),
    INDEX `fasi_produzione_stato_idx`(`stato`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problemi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordine_id` INTEGER NOT NULL,
    `fase` VARCHAR(100) NULL,
    `tipo_problema` VARCHAR(50) NOT NULL,
    `descrizione` TEXT NOT NULL,
    `gravita` VARCHAR(20) NOT NULL,
    `segnalato_da` INTEGER NOT NULL,
    `data_segnalazione` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `foto_segnalazione_paths` JSON NULL,
    `risolto` BOOLEAN NOT NULL DEFAULT false,
    `risolto_da` INTEGER NULL,
    `data_risoluzione` DATETIME(3) NULL,
    `descrizione_risoluzione` TEXT NULL,
    `foto_risoluzione_paths` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `problemi_ordine_id_idx`(`ordine_id`),
    INDEX `problemi_risolto_idx`(`risolto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `note` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordine_id` INTEGER NOT NULL,
    `testo` TEXT NOT NULL,
    `foto_paths` JSON NULL,
    `creato_da` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `note_ordine_id_idx`(`ordine_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_attivita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ordine_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `azione` VARCHAR(100) NOT NULL,
    `dettagli` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `log_attivita_ordine_id_idx`(`ordine_id`),
    INDEX `log_attivita_azione_idx`(`azione`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `materiali` ADD CONSTRAINT `materiali_ordine_id_fkey` FOREIGN KEY (`ordine_id`) REFERENCES `ordini`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fasi_produzione` ADD CONSTRAINT `fasi_produzione_ordine_id_fkey` FOREIGN KEY (`ordine_id`) REFERENCES `ordini`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fasi_produzione` ADD CONSTRAINT `fasi_produzione_completata_da_fkey` FOREIGN KEY (`completata_da`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problemi` ADD CONSTRAINT `problemi_ordine_id_fkey` FOREIGN KEY (`ordine_id`) REFERENCES `ordini`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problemi` ADD CONSTRAINT `problemi_segnalato_da_fkey` FOREIGN KEY (`segnalato_da`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problemi` ADD CONSTRAINT `problemi_risolto_da_fkey` FOREIGN KEY (`risolto_da`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note` ADD CONSTRAINT `note_ordine_id_fkey` FOREIGN KEY (`ordine_id`) REFERENCES `ordini`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `note` ADD CONSTRAINT `note_creato_da_fkey` FOREIGN KEY (`creato_da`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_attivita` ADD CONSTRAINT `log_attivita_ordine_id_fkey` FOREIGN KEY (`ordine_id`) REFERENCES `ordini`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_attivita` ADD CONSTRAINT `log_attivita_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
