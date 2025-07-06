"use client";

import Link from "next/link";
import { Container } from "@/components/shared/Container";
import {
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Shield,
  Building,
  FileText,
} from "lucide-react";

// Interface pour les liens de navigation
interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

// Données des services France
const servicesFrance: FooterLink[] = [
  { label: "Maîtrise d'œuvre", href: "/services/maitrise-oeuvre" },
  { label: "Suivi de chantiers", href: "/services/suivi-chantiers" },
  { label: "AMO", href: "/services/amo" },
  { label: "Études techniques", href: "/services/etudes-techniques" },
  { label: "Conseil BTP", href: "/services/conseil" },
  { label: "Expertise", href: "/services/expertise" },
];

// Données des services Niger
const servicesNiger: FooterLink[] = [
  { label: "Location grues", href: "/services/location-grues" },
  { label: "Télescopiques", href: "/services/telescopiques" },
  { label: "Nacelles", href: "/services/nacelles" },
  { label: "Matériel chantier", href: "/services/materiel-chantier" },
  { label: "Maintenance", href: "/services/maintenance" },
  { label: "Transport", href: "/services/transport" },
];

// Données légales
const legal: FooterLink[] = [
  { label: "Mentions légales", href: "/legal/mentions-legales" },
  { label: "Conditions générales", href: "/legal/cgu" },
  {
    label: "Politique de confidentialité",
    href: "/legal/politique-confidentialite",
  },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Plan du site", href: "/sitemap" },
  { label: "Accessibilité", href: "/legal/accessibilite" },
];

// Données des réseaux sociaux
const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/daga-maraka-btp",
    icon: Linkedin,
    color: "hover:text-blue-400",
  },
  {
    name: "Facebook",
    href: "https://facebook.com/dagamarakabtp",
    icon: Facebook,
    color: "hover:text-blue-500",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/dagamaraka_btp",
    icon: Instagram,
    color: "hover:text-pink-400",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@dagamarakabtp",
    icon: Youtube,
    color: "hover:text-red-500",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/dagamaraka_btp",
    icon: Twitter,
    color: "hover:text-blue-400",
  },
];

// Données des certifications (pour usage futur)
// const certifications = [
//   {
//     name: "Qualibat",
//     description: "Qualification BTP",
//     icon: Award,
//   },
//   {
//     name: "RGE",
//     description: "Reconnu Garant Environnement",
//     icon: CheckCircle,
//   },
//   {
//     name: "ISO 9001",
//     description: "Management Qualité",
//     icon: Shield,
//   },
// ];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 dark:bg-black text-white">
      <Container>
        {/* Section principale du footer */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Colonne 1: Logo + Description + Réseaux sociaux */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <Link href="/" className="inline-block">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-btp-orange-500 to-btp-blue-500 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xl text-white">
                        Daga Maraka
                      </div>
                      <div className="text-btp-orange-400 text-sm font-medium">
                        BTP
                      </div>
                    </div>
                  </div>
                </Link>
                <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                  Expert BTP depuis 15 ans, nous accompagnons vos projets avec
                  notre double expertise : conseil & ingénierie en France,
                  location de matériel au Niger.
                </p>
              </div>

              {/* Informations de contact */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-btp-orange-400 flex-shrink-0" />
                  <span className="text-neutral-300">France & Niger</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-btp-orange-400 flex-shrink-0" />
                  <a
                    href="tel:+33123456789"
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    +33 1 23 45 67 89
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-btp-orange-400 flex-shrink-0" />
                  <a
                    href="mailto:contact@dagamaraka.com"
                    className="text-neutral-300 hover:text-white transition-colors"
                  >
                    contact@dagamaraka.com
                  </a>
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div>
                <h4 className="font-semibold text-white mb-4">Suivez-nous</h4>
                <div className="flex gap-3">
                  {socialLinks.map((social) => {
                    const IconComponent = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-9 h-9 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 transition-all duration-200 hover:bg-neutral-700 ${social.color}`}
                        aria-label={social.name}
                      >
                        <IconComponent className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Colonne 2: Services France */}
            <div>
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
                  🇫🇷
                </div>
                Services France
              </h3>
              <ul className="space-y-3">
                {servicesFrance.map((service, index) => (
                  <li key={index}>
                    <Link
                      href={service.href}
                      className="text-neutral-300 hover:text-btp-orange-400 text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {service.label}
                      </span>
                      {service.external && (
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 3: Services Niger */}
            <div>
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center">
                  🇳🇪
                </div>
                Services Niger
              </h3>
              <ul className="space-y-3">
                {servicesNiger.map((service, index) => (
                  <li key={index}>
                    <Link
                      href={service.href}
                      className="text-neutral-300 hover:text-btp-orange-400 text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {service.label}
                      </span>
                      {service.external && (
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Colonne 4: Légal + Certifications */}
            <div>
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-btp-orange-400" />
                Informations légales
              </h3>
              <ul className="space-y-3 mb-8">
                {legal.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-neutral-300 hover:text-btp-orange-400 text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {item.label}
                      </span>
                      {item.external && (
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Certifications */}
              {/* <div>
                <h4 className="font-semibold text-white mb-4">
                  Certifications
                </h4>
                <div className="space-y-3">
                  {certifications.map((cert, index) => {
                    const IconComponent = cert.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-btp-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-4 h-4 text-btp-orange-400" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">
                            {cert.name}
                          </div>
                          <div className="text-neutral-400 text-xs">
                            {cert.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-neutral-800"></div>

        {/* Section copyright et liens rapides */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-neutral-400 text-sm">
                © {currentYear} Daga Maraka BTP. Tous droits réservés.
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                SIRET : 123 456 789 00012 | APE : 4299Z
              </p>
            </div>

            {/* Liens rapides */}
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <Link
                href="/about"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                À propos
              </Link>
              <Link
                href="/services"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Services
              </Link>
              <Link
                href="/contact"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/devis"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Devis gratuit
              </Link>
            </div>

            {/* Badge certification */}
            <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs font-medium">
                Certifié BTP
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
