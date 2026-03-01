-- AlterTable
ALTER TABLE `ordini` ADD COLUMN `consegna_anticipata_ft` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `data_consegna_effettiva_ft` DATETIME(3) NULL,
    ADD COLUMN `data_consegna_ft` DATE NULL,
    ADD COLUMN `data_preparazione_ft` DATETIME(3) NULL,
    ADD COLUMN `ft_consegnato` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ft_consegnato_da` INTEGER NULL,
    ADD COLUMN `ft_preparato` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ft_preparato_da` INTEGER NULL,
    ADD COLUMN `tipo_consegna_ft` VARCHAR(20) NULL;

-- CreateIndex
CREATE INDEX `ordini_consegna_anticipata_ft_idx` ON `ordini`(`consegna_anticipata_ft`);

-- AddForeignKey
ALTER TABLE `ordini` ADD CONSTRAINT `ordini_ft_preparato_da_fkey` FOREIGN KEY (`ft_preparato_da`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordini` ADD CONSTRAINT `ordini_ft_consegnato_da_fkey` FOREIGN KEY (`ft_consegnato_da`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
