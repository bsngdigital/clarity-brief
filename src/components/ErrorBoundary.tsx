import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (window.location.hash || window.location.pathname !== '/') {
      window.location.href = '/'
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBFBF9] text-[#172019] flex items-center justify-center p-6 antialiased font-sans">
          <div className="max-w-lg w-full bg-white rounded-[24px] border border-[#EBEBE6] p-8 shadow-[0_20px_40px_-24px_rgba(23,32,25,0.15)] text-center">
            <div className="size-14 mx-auto rounded-2xl bg-[#FBEAEA] text-[#9E3434] grid place-items-center mb-5 ring-1 ring-[#F3CFCF]">
              <AlertTriangle className="size-7" />
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-[#172019]">
              Terjadi Kesalahan Tampilan
            </h1>

            <p className="mt-2.5 text-sm text-[#737A74] leading-relaxed">
              Aplikasi mengalami kendala saat memuat data. Jangan khawatir, data Anda di Supabase tetap aman.
            </p>

            {this.state.error && (
              <div className="mt-5 text-left bg-[#F4F4F0] rounded-xl p-3.5 text-xs font-mono text-[#9E3434] overflow-x-auto max-h-32 border border-[#EBEBE6]">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#172019] text-white text-sm font-semibold hover:bg-black transition shadow-sm"
              >
                <RefreshCw className="size-4" />
                Muat Ulang Halaman
              </button>

              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#172019] border border-[#EBEBE6] text-sm font-semibold hover:bg-[#F4F4F0] transition"
              >
                <Home className="size-4" />
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
