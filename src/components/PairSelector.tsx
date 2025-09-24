import React, { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { PairSelectorProps } from '@/types';

const PairSelector: React.FC<PairSelectorProps> = ({
  selectedPair,
  availablePairs,
  onChange
}) => {
  // const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Listbox value={selectedPair} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full min-w-[180px] cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-gray-300 dark:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm">
            <span className="flex items-center">
              <span className="block truncate font-medium text-gray-900 dark:text-gray-100">
                {selectedPair.displayName}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {availablePairs.map((pair) => (
                <Listbox.Option
                  key={pair.symbol}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`
                  }
                  value={pair}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center">
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {pair.displayName}
                        </span>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {pair.symbol}
                        </span>
                      </div>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default PairSelector;