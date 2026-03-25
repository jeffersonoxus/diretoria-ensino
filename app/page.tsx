import Link from 'next/link'
import { createClient } from '@/lib/supabase/middleware'
import { AuthStatus } from '@/components/AuthStatus'
import { 
  BookOpen, 
  Users, 
  Target, 
  Clock, 
  Heart, 
  Sparkles,
  ArrowRight,
  GraduationCap,
  Star,
  BookMarked,
  Brain,
  CalendarCheck
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sectors = [
    {
      title: "Educação Infantil",
      icon: Heart,
      color: "from-[#ffa301] to-[#ffa301]",
      bgColor: "bg-[#ffa301]/10",
      description: "Construindo bases sólidas para o desenvolvimento integral das crianças",
      features: ["Creche", "Pré-escola", "Desenvolvimento socioemocional"]
    },
    {
      title: "Anos Iniciais",
      icon: BookOpen,
      color: "from-[#24cffd] to-[#24cffd]",
      bgColor: "bg-[#24cffd]/10",
      description: "Alfabetização e letramento para o 1º ao 5º ano",
      features: ["Alfabetização", "Matemática básica", "Projetos interdisciplinares"]
    },
    {
      title: "Anos Finais",
      icon: GraduationCap,
      color: "from-[#a94dff] to-[#a94dff]",
      bgColor: "bg-[#a94dff]/10",
      description: "Aprofundamento do conhecimento do 6º ao 9º ano",
      features: ["Componentes curriculares", "Pensamento crítico", "Orientação profissional"]
    },
    {
      title: "Educação Especial",
      icon: Star,
      color: "from-[#ffa301] to-[#ffa301]",
      bgColor: "bg-[#ffa301]/10",
      description: "Inclusão e atendimento especializado para todos os estudantes",
      features: ["AEE", "Adaptações curriculares", "Acessibilidade"]
    },
    {
      title: "Programas e Projetos",
      icon: Target,
      color: "from-[#24cffd] to-[#24cffd]",
      bgColor: "bg-[#24cffd]/10",
      description: "Iniciativas que transformam a experiência educacional",
      features: ["Intervenções pedagógicas", "Projetos especiais", "Parcerias"]
    },
    {
      title: "EJA",
      icon: Clock,
      color: "from-[#a94dff] to-[#a94dff]",
      bgColor: "bg-[#a94dff]/10",
      description: "Educação de Jovens e Adultos - segunda chance para aprender",
      features: ["Alfabetização EJA", "Ensino Fundamental", "Ensino Médio"]
    },
    {
      title: "Educação em Tempo Integral",
      icon: CalendarCheck,
      color: "from-[#ffa301] to-[#ffa301]",
      bgColor: "bg-[#ffa301]/10",
      description: "Desenvolvimento pleno com jornada ampliada",
      features: ["Itinerários formativos", "Oficinas", "Acompanhamento pedagógico"]
    },
    {
      title: "Avaliação",
      icon: Brain,
      color: "from-[#24cffd] to-[#24cffd]",
      bgColor: "bg-[#24cffd]/10",
      description: "Monitoramento e análise do desempenho escolar",
      features: ["Indicadores", "Relatórios", "Diagnósticos"]
    },
    {
      title: "Formação Continuada",
      icon: BookMarked,
      color: "from-[#a94dff] to-[#a94dff]",
      bgColor: "bg-[#a94dff]/10",
      description: "Capacitação e aperfeiçoamento profissional",
      features: ["Cursos", "Workshops", "Grupos de estudo"]
    }
  ]

  const highlights = [
    { number: "15.000+", label: "Estudantes atendidos", icon: Users },
    { number: "850+", label: "Educadores dedicados", icon: Star },
    { number: "32", label: "Escolas da rede", icon: GraduationCap },
    { number: "9", label: "Setores especializados", icon: Target }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#7114dd] via-[#7114dd] to-[#a94dff] text-white overflow-hidden">
        {/* Grid pattern usando div com background image via style inline */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#a94dff] to-[#7114dd]" />
        
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">DIEN</h1>
          </div>
          <div>
            {user ? (
              <Link
                href="/dien"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-full hover:bg-white/30 transition-all border border-white/30"
              >
                DIEN
              </Link>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/cadastro"
                  className="bg-[#ffa301] text-[#7114dd] px-6 py-2.5 rounded-full hover:bg-[#ffa301]/90 transition-all font-medium"
                >
                  Cadastro
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6">
              <span className="block">Diretoria de Ensino</span>
              <span className="block bg-linear-to-r from-[#ffa301] to-[#24cffd] bg-clip-text text-transparent">
                Inovação e Excelência
              </span>
            </h2>
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-white/90 mb-12">
              Transformando a educação através de setores especializados, formação continuada 
              e compromisso com o desenvolvimento integral de cada estudante.
            </p>
            {!user && (
              <Link
                href="/cadastro"
                className="inline-flex items-center space-x-2 bg-[#ffa301] text-[#7114dd] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#ffa301]/90 transition-all transform hover:scale-105"
              >
                <span>Começar agora</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {highlights.map((item, index) => (
              <div key={index} className="text-center group cursor-default">
                <div className="inline-flex p-4 bg-[#7114dd]/10 rounded-2xl group-hover:scale-110 transition-transform mb-4">
                  <item.icon className="h-8 w-8 text-[#7114dd]" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{item.number}</div>
                <div className="text-sm text-gray-600">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nossos Setores</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nove áreas especializadas trabalhando em sinergia para uma educação completa e transformadora
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sectors.map((sector, index) => {
              const Icon = sector.icon
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${sector.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
                  
                  <div className={`inline-flex p-3 ${sector.bgColor} rounded-xl mb-4`}>
                    <Icon className={`h-6 w-6 text-${sector.color.split('from-')[1].split(' ')[0]}`} style={{ color: sector.color.split('from-')[1].split(' ')[0] }} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {sector.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 text-sm">
                    {sector.description}
                  </p>

                  <div className="space-y-2">
                    {sector.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-500">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${sector.color} mr-2`} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#7114dd] to-[#a94dff] text-white relative overflow-hidden">
        {/* Grid pattern usando div com background image via style inline */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '50px 50px'
          }}
        />
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Faça parte da transformação educacional
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Junte-se à DIEN e contribua para uma educação mais inclusiva, inovadora e de qualidade
          </p>
          {!user && (
            <Link
              href="/cadastro"
              className="inline-flex items-center justify-center space-x-2 bg-[#ffa301] text-[#7114dd] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#ffa301]/90 transition-all transform hover:scale-105"
            >
              <span>Cadastre-se agora</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Auth Status Section */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AuthStatus />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-[#ffa301]" />
                <span className="text-lg font-bold">DIEN</span>
              </div>
              <p className="text-gray-400 text-sm">
                Diretoria de Ensino comprometida com a excelência educacional e o desenvolvimento integral.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Setores</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Educação Infantil</li>
                <li>Anos Iniciais</li>
                <li>Anos Finais</li>
                <li>Educação Especial</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Institucional</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Sobre nós</li>
                <li>Contato</li>
                <li>Trabalhe conosco</li>
                <li>Transparência</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Termos de uso</li>
                <li>Política de privacidade</li>
                <li>LGPD</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 DIEN - Diretoria de Ensino. Todos os direitos reservados.</p>
            <p className="mt-2">Desenvolvido por <span className="text-white font-medium">Jefferson</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}