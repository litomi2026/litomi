import styles from './Squircle.module.css'

type Props = {
  children?: string
  className?: string
  fill?: string
  src?: string
  wrapperClassName: string
}

export default function Squircle({
  src,
  fill,
  children,
  wrapperClassName = '',
  className = '',
}: Props) {
  return (
    <div className={`${styles.userImg} ${wrapperClassName}`}>
      <svg className="overflow-hidden rounded-[40%]" viewBox="0 0 88 88">
        <path
          d="M44,0 C76.0948147,0 88,11.9051853 88,44 C88,76.0948147 76.0948147,88 44,88 C11.9051853,88 0,76.0948147 0,44 C0,11.9051853 11.9051853,0 44,0 Z"
          fill={fill}
          id="shapeSquircle"
        />
        <clipPath id="clipSquircle">
          <use xlinkHref="#shapeSquircle" />
        </clipPath>
        {src ? (
          <image
            clipPath="url(#clipSquircle)"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            width="100%"
            xlinkHref={src}
          />
        ) : (
          <>
            <rect clipPath="url(#clipSquircle)" x="0" y="0" />
            <text
              className={`text-[2rem] ${className}`}
              dy="10"
              textAnchor="middle"
              x="50%"
              y="50%"
            >
              {children}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
