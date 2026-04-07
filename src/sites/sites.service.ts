import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig } from './entities/site-config.entity';
import { UpsertSiteConfigDto } from './dto/upsert-site-config.dto';

@Injectable()
export class SitesService {
  constructor(@InjectRepository(SiteConfig) private readonly siteRepo: Repository<SiteConfig>) {}

  async resolveSite(siteKey?: string, host?: string) {
    if (siteKey) {
      return this.siteRepo.findOne({ where: { siteKey, isActive: true } as any });
    }

    if (host) {
      return this.siteRepo.findOne({ where: { domain: host, isActive: true } as any });
    }

    return this.siteRepo.findOne({ where: { siteKey: 'default', isActive: true } as any });
  }

  async list() {
    const items = await this.siteRepo.find({ order: { createdAt: 'DESC' } });
    return { ok: true, data: items };
  }

  async upsert(dto: UpsertSiteConfigDto) {
    let row = await this.siteRepo.findOne({ where: { siteKey: dto.siteKey } as any });
    if (!row) {
      row = this.siteRepo.create({
        siteKey: dto.siteKey,
        siteName: dto.siteName,
        domain: dto.domain ?? null,
        currency: dto.currency ?? 'MYR',
        paymentProvider: dto.paymentProvider ?? 'manual',
        liveCasinoProvider: dto.liveCasinoProvider ?? 'evolution',
        isActive: dto.isActive ?? true,
        metaJson: dto.meta ?? null,
      });
    } else {
      row.siteName = dto.siteName ?? row.siteName;
      row.domain = dto.domain ?? row.domain;
      row.currency = dto.currency ?? row.currency;
      row.paymentProvider = dto.paymentProvider ?? row.paymentProvider;
      row.liveCasinoProvider = dto.liveCasinoProvider ?? row.liveCasinoProvider;
      if (dto.isActive != null) row.isActive = dto.isActive;
      row.metaJson = dto.meta ?? row.metaJson;
    }

    await this.siteRepo.save(row);
    return { ok: true, data: row };
  }
}
