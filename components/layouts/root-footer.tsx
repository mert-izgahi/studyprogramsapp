"use client"

import React from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import Container from '../shared/container'
import Logo from '../shared/logo'
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

interface FooterLink {
  href: string
  label: string
  isExternal?: boolean
}

interface SocialLink {
  icon: React.ReactNode
  href: string
  label: string
}

function RootFooter() {
  const locale = useLocale()
  const t = useTranslations('footer')
  const isRTL = locale === 'ar'

  // Navigation links with proper paths
  const navLinks: FooterLink[] = [
    { href: '/', label: t('nav.home') },
    { href: '/programs', label: t('nav.programs') },
    { href: '/signup', label: t('nav.signup') },
    { href: '/signin', label: t('nav.signin') }
  ]

  const aboutLinks: FooterLink[] = [
    { href: '/about', label: t('about.aboutUs') },
    { href: '/contact', label: t('about.contactUs') },
    { href: '/faq', label: t('about.faq') },
    { href: '/terms', label: t('about.termsOfUse') },
    { href: '/privacy', label: t('about.privacyPolicy') }
  ]

  const socialLinks: SocialLink[] = [
    { icon: <Facebook className="h-5 w-5" />, href: 'https://facebook.com/joodystudy', label: 'Facebook' },
    { icon: <Twitter className="h-5 w-5" />, href: 'https://twitter.com/joodystudy', label: 'Twitter' },
    { icon: <Instagram className="h-5 w-5" />, href: 'https://instagram.com/joodystudy', label: 'Instagram' },
    { icon: <Linkedin className="h-5 w-5" />, href: 'https://linkedin.com/company/joodystudy', label: 'LinkedIn' },
    { icon: <Youtube className="h-5 w-5" />, href: 'https://youtube.com/joodystudy', label: 'YouTube' }
  ]

  const contactInfo = [
    { icon: <Mail className="h-5 w-5" />, text: 'info@joodystudy.com', href: 'mailto:info@joodystudy.com' },
    { icon: <Phone className="h-5 w-5" />, text: '+966 123 456 789', href: 'tel:+966123456789' },
    { icon: <MapPin className="h-5 w-5" />, text: t('contact.address') }
  ]

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-carbon text-white mt-auto" role="contentinfo" aria-label={t('aria.footer')}>
      {/* Main Footer Content */}
      <div className="py-12 border-b border-white/10">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <Logo />
              <p className="text-sm text-white/80 leading-relaxed">
                {t('description')}
              </p>

              {/* Social Links */}
              <div className="flex gap-3 pt-2" role="list" aria-label={t('aria.socialLinks')}>
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label={social.label}
                    role="listitem"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h4 className="font-bold text-lg mb-4 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-white/50 pb-2">
                {t('quickLinks')}
              </h4>
              <ul className="space-y-2" role="list" aria-label={t('aria.quickLinks')}>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-white transition-colors duration-200 focus:outline-none focus:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About Links */}
            <div>
              <h4 className="font-bold text-lg mb-4 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-white/50 pb-2">
                {t('aboutUs')}
              </h4>
              <ul className="space-y-2" role="list" aria-label={t('aria.aboutLinks')}>
                {aboutLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-white/80 hover:text-white transition-colors duration-200 focus:outline-none focus:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="font-bold text-lg mb-4 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-white/50 pb-2">
                {t('contactUs')}
              </h4>
              <ul className="space-y-3" role="list" aria-label={t('aria.contactInfo')}>
                {contactInfo.map((item, index) => (
                  <li key={index}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="flex items-center gap-3 text-white/80 hover:text-white transition-colors duration-200 group"
                      >
                        <span className="text-white/60 group-hover:text-white transition-colors">
                          {item.icon}
                        </span>
                        <span className="text-sm">{item.text}</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 text-white/80">
                        <span className="text-white/60">{item.icon}</span>
                        <span className="text-sm">{item.text}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </div>

      {/* Copyright Bar */}
      <div className="py-4">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>
              © {currentYear} JoodyStudy. {t('copyright')}
            </p>

            {/* Language Switcher - Optional */}
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors duration-200"
              >
                {t('privacy')}
              </Link>
              <span aria-hidden="true">•</span>
              <Link
                href="/terms"
                className="hover:text-white transition-colors duration-200"
              >
                {t('terms')}
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  )
}

export default RootFooter