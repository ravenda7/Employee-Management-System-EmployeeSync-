type Props = {
  className?: string;
}

export const Loader = ({className}: Props) => {
  return (
      <div className={`${className} animate-spin rounded-full border-2 border-primary/50 border-t-transparent h-8 w-8`} ></div>
  );
}