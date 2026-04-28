'use client'

import { useState, forwardRef } from 'react'

interface FolderItem {
  id: string
  title: string
  color: string
}

interface AnimatedFolderProps {
  title: string
  items: FolderItem[]
  folderColor?: string
  href?: string
  className?: string
}

const ItemCard = forwardRef<
  HTMLDivElement,
  { item: FolderItem; index: number; isVisible: boolean; delay: number }
>(({ item, index, isVisible, delay }, ref) => {
  const rotations = [-12, 0, 12]
  const translations = [-50, 0, 50]

  return (
    <div
      ref={ref}
      className="absolute w-16 h-22 rounded-lg overflow-hidden border border-white/10"
      style={{
        background: item.color,
        transform: isVisible
          ? `translateY(-85px) translateX(${translations[index]}px) rotate(${rotations[index]}deg) scale(1)`
          : 'translateY(0px) translateX(0px) rotate(0deg) scale(0.5)',
        opacity: isVisible ? 1 : 0,
        transition: `all 600ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
        zIndex: 10 - index,
        left: '-32px',
        top: '-44px',
        width: '64px',
        height: '88px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <p className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] font-medium text-white truncate">
        {item.title}
      </p>
    </div>
  )
})

ItemCard.displayName = 'ItemCard'

export function AnimatedFolder({
  title,
  items,
  folderColor = '#f59e0b',
  href,
  className = '',
}: AnimatedFolderProps) {
  const [isHovered, setIsHovered] = useState(false)

  const backColor = folderColor
  const frontColor = folderColor
  const tabColor = folderColor

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl cursor-pointer bg-white/[0.03] border border-white/[0.06] transition-all duration-500 ease-out hover:border-white/10 group ${className}`}
      style={{ minWidth: '160px', minHeight: '220px', perspective: '1000px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 70%, ${folderColor} 0%, transparent 70%)`,
          opacity: isHovered ? 0.06 : 0,
        }}
      />

      <div className="relative flex items-center justify-center mb-3" style={{ height: '120px', width: '140px' }}>
        {/* Folder back */}
        <div
          className="absolute rounded-lg"
          style={{
            width: '96px',
            height: '72px',
            background: `linear-gradient(180deg, ${backColor}88 0%, ${backColor}66 100%)`,
            transformOrigin: 'bottom center',
            transform: isHovered ? 'rotateX(-15deg)' : 'rotateX(0deg)',
            transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        />

        {/* Folder tab */}
        <div
          className="absolute rounded-t-md"
          style={{
            width: '36px',
            height: '12px',
            background: `${tabColor}aa`,
            top: 'calc(50% - 36px - 10px)',
            left: 'calc(50% - 48px + 12px)',
            transformOrigin: 'bottom center',
            transform: isHovered ? 'rotateX(-25deg) translateY(-2px)' : 'rotateX(0deg)',
            transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 10,
          }}
        />

        {/* Item cards */}
        <div
          className="absolute"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 }}
        >
          {items.slice(0, 3).map((item, index) => (
            <ItemCard
              key={item.id}
              item={item}
              index={index}
              isVisible={isHovered}
              delay={index * 80}
            />
          ))}
        </div>

        {/* Folder front */}
        <div
          className="absolute rounded-lg"
          style={{
            width: '96px',
            height: '72px',
            background: `linear-gradient(180deg, ${frontColor}cc 0%, ${frontColor}99 100%)`,
            top: 'calc(50% - 36px + 3px)',
            transformOrigin: 'bottom center',
            transform: isHovered ? 'rotateX(25deg) translateY(6px)' : 'rotateX(0deg)',
            transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 30,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />

        {/* Folder shine */}
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            width: '96px',
            height: '72px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)',
            top: 'calc(50% - 36px + 3px)',
            transformOrigin: 'bottom center',
            transform: isHovered ? 'rotateX(25deg) translateY(6px)' : 'rotateX(0deg)',
            transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 31,
          }}
        />
      </div>

      <h3
        className="text-sm font-semibold text-white mt-2 transition-all duration-300"
        style={{ transform: isHovered ? 'translateY(3px)' : 'translateY(0)' }}
      >
        {title}
      </h3>


      {href && (
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="absolute inset-0 z-40"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
