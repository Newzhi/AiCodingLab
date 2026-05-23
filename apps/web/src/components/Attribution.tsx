type Props = {
  validTime: string | null
}

export function Attribution({ validTime }: Props) {
  return (
    <footer className="attribution">
      <p>
        数据来源：NOAA GFS（气温/气压/风）、Copernicus Marine（洋流）。仅供科研演示，商用请核对许可。
      </p>
      {validTime && <p>valid_time: {validTime}</p>}
    </footer>
  )
}
